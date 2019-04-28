const config = require('./config')
const { promisify } = require('util')
const redis = require('redis')
const { Storage } = require('@google-cloud/storage')
const log = require('./log')
const storage = new Storage({
  projectId: config.projectId
})

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

  // Only keep the photos from last 30 invocations to avoid repeats.
  if (previousPhotoNameSet.size >= 30) {
    await redisLpop(redisKey)
  }
  await redisRpush(redisKey, randomPhotoFile.name)
  await redisQuit()

  // Retrieve metadata of the given file.
  const [metadata] = await randomPhotoFile.getMetadata()

  return { file: randomPhotoFile, metadata }
}

const download = async (file, destinationURL) => {
  return storage
    .bucket(config.storageBucketName)
    .file(file.name)
    .download({ destination: destinationURL })
}

module.exports = { selectRandomFile, download }
