const config = require('./config')
const gmailSend = require('gmail-send')
const { Storage } = require('@google-cloud/storage')
const { ExifImage } = require('exif')
const redis = require('redis')
const { promisify } = require('util')

const opts = {
  level: 'all',
  timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
}
const log = require('simple-node-logger').createSimpleLogger(opts)

const storage = new Storage({
  projectId: config.projectId
})

const selectRandomPhoto = async () => {
  const [files] = await storage.bucket(config.storageBucketName).getFiles()

  // Set up Redis connection and relevant methods that will be used.
  const client = redis.createClient({ host: 'redis' })
  const redisLrange = promisify(client.lrange).bind(client)
  const redisLpop = promisify(client.lpop).bind(client)
  const redisRpush = promisify(client.rpush).bind(client)
  const redisQuit = promisify(client.quit).bind(client)

  const redisKey = 'key'
  const previousPhotoFileNames = await redisLrange(redisKey, 0, -1)
  const previousPhotoNameSet = new Set(previousPhotoFileNames)
  const filteredPhotoFiles = files.filter((file) => {
    return !previousPhotoNameSet.has(file.name)
  })
  const randomIndex = Math.floor(Math.random() * filteredPhotoFiles.length)
  const randomPhotoFile = filteredPhotoFiles[randomIndex]

  // Only keep the photos from last 30 invocatinos to avoid repeats.
  if (previousPhotoNameSet.size >= 30) {
    await redisLpop(redisKey)
  }
  await redisRpush(redisKey, randomPhotoFile.name)
  await redisQuit()
  return randomPhotoFile
}

const getPhoto = async (file) => {
  const fileURL = './photo.jpeg'
  await storage
    .bucket(config.storageBucketName)
    .file(file.name)
    .download({ destination: './photo.jpeg' })
  return fileURL
}

const getPhotoExif = (photoURL) => {
  return new Promise((resolve, reject) => {
    ExifImage({ image: photoURL }, (err, exif) => {
      if (err !== null) {
        reject(err)
      } else {
        resolve({ photoURL, exif })
      }
    })
  })
}

const sendEmail = (photoURL, exif, recipients) => {
  // Parse the date portion from the exif date time and
  const split = exif.exif.DateTimeOriginal.split(' ')
  const photoDate = split[0].replace(/:/g, '-')

  const send = gmailSend({
    user: config.emailUserName,
    pass: config.password,
    subject: `Sherlock photo of the day from ${photoDate}`,
    text: 'That\'s our Sherlock!',
    files: [photoURL]
  })
  const promises = recipients.map(recipient => {
    return new Promise((resolve, reject) =>
      send({
        to: recipient
      }, (err, res) => {
        if (err != null) {
          reject(err)
        } else {
          log.info('success sending email!')
          resolve(res)
        }
      })
    )
  })
  return Promise.all(promises)
}

selectRandomPhoto()
  .then(file => {
    return getPhoto(file)
  })
  .then(photoURL => {
    return getPhotoExif(photoURL)
  })
  .then(({ photoURL, exif }) => {
    return sendEmail(photoURL, exif, config.recipients)
  })
  .catch((error) => {
    log.error(error)
  })
