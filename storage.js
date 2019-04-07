const config = require('./config')
const { Storage } = require('@google-cloud/storage')

const storage = new Storage({
  projectId: config.projectId
})

const getFiles = async () => {
  return storage.bucket(config.storageBucketName).getFiles()
}

const download = async (file, destinationURL) => {
  return storage
    .bucket(config.storageBucketName)
    .file(file.name)
    .download({ destination: destinationURL })
}

module.exports = { getFiles, download }
