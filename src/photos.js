const { ExifImage } = require('exif')
const log = require('./log')
const storage = require('./storage')

const getPhoto = async (file) => {
  const fileURL = './photo.jpeg'
  await storage.download(file, fileURL)
  return getPhotoData(fileURL)
}

const getPhotoData = (photoURL) => {
  const emailText = `Sherlock's best time`
  return new Promise((resolve, reject) => {
    ExifImage({ image: photoURL }, (err, exif) => {
      if (err !== null) {
        log.error(err)
        resolve({
          files: [photoURL],
          subject: `Sherlock photo of the day`,
          text: emailText
        })
      } else {
        // Parse the date portion from the exif date time and
        const split = exif.exif.DateTimeOriginal.split(' ')
        const photoDate = split[0].replace(/:/g, '-')
        resolve({
          files: [photoURL],
          subject: `Sherlock photo of the day from ${photoDate}`,
          text: emailText
        })
      }
    })
  })
}

module.exports = { getPhoto }
