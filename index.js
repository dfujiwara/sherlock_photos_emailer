const config = require('./config')
const { Storage } = require('@google-cloud/storage')
const redis = require('redis')
const { promisify } = require('util')
const log = require('./log')
const email = require('./email')
const photos = require('./photos')

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

const run = async () => {
  try {
    const file = await selectRandomPhoto()
    const photoData = await photos.getPhoto(file)
    await email.send(photoData, config.recipients, config.emailUserName, config.password)
  } catch (error) {
    log.error(error)
  }
}

run()
