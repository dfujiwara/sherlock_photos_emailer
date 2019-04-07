const config = require('./config')
const { ExifImage } = require('exif')
const log = require('./log')
const { Storage } = require('@google-cloud/storage')

const storage = new Storage({
  projectId: config.projectId
})

const getPhoto = async (file) => {
  const fileURL = './photo.jpeg'
  await storage
    .bucket(config.storageBucketName)
    .file(file.name)
    .download({ destination: fileURL })

  return getPhotoData(fileURL)
}

const getPhotoData = (photoURL) => {
  return new Promise((resolve, reject) => {
    ExifImage({ image: photoURL }, (err, exif) => {
      if (err !== null) {
        log.error(err)
        resolve({
          photoURL,
          subject: `Sherlock photo of the day`
        })
      } else {
        // Parse the date portion from the exif date time and
        const split = exif.exif.DateTimeOriginal.split(' ')
        const photoDate = split[0].replace(/:/g, '-')
        resolve({
          photoURL,
          subject: `Sherlock photo of the day from ${photoDate}`
        })
      }
    })
  })
}

module.exports = { getPhoto }
