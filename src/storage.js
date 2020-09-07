const config = require('./config')
const { promisify } = require('util')
const redis = require('redis')
const { Storage } = require('@google-cloud/storage')
const log = require('./log')
const storage = new Storage({
  projectId: config.projectId
})

const FileTypes = Object.freeze({
  video: 'video',
  photo: 'image'
})

// Only keep the photos from last designated invocations to avoid repeats.
const previousPhotoCountToFilter = 150

const selectRandomFile = async () => {
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
  log.info(`filtered photos from ${files.length} to ${filteredPhotoFiles.length}`)

  const randomIndex = Math.floor(Math.random() * filteredPhotoFiles.length)
  const randomPhotoFile = filteredPhotoFiles[randomIndex]

  if (previousPhotoNameSet.size >= previousPhotoCountToFilter) {
    await redisLpop(redisKey)
  }
  await redisRpush(redisKey, randomPhotoFile.name)
  await redisQuit()

  // Retrieve metadata of the given file.
  const [metadata] = await randomPhotoFile.getMetadata()
  const fileType = parseFileType(metadata)
  return { file: randomPhotoFile, fileType }
}

const download = async (file, destinationURL) => {
  return storage
    .bucket(config.storageBucketName)
    .file(file.name)
    .download({ destination: destinationURL })
}

const parseFileType = (metadata) => {
  const contentType = metadata.contentType
  if (contentType === undefined) {
    return FileTypes.photo
  }
  const contentTypeArray = contentType.split('/')
  if (contentTypeArray.length === 0) {
    return FileTypes.photo
  }
  switch (contentTypeArray[0]) {
    case FileTypes.video:
      return FileTypes.video
    default:
      return FileTypes.photo
  }
}

module.exports = {
  selectRandomFile,
  download,
  FileTypes
}
