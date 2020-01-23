const { ExifImage } = require('exif')
const log = require('./log')
const storage = require('./storage')

const getPhoto = async (file) => {
  const fileURL = './photo.jpeg'
  await storage.download(file, fileURL)
  return getPhotoData(fileURL)
}

const determineAge = (photoDate, today = new Date()) => {
  const sherlockBirthday = new Date('2013-06-13')
  const millisecondDifference = photoDate - sherlockBirthday
  const yearDifference = Math.floor(millisecondDifference / (86400 * 1000 * 365))
  return yearDifference
}

const getPhotoData = (photoURL) => {
  return new Promise((resolve, reject) => {
    ExifImage({ image: photoURL }, (err, exif) => {
      if (err !== null) {
        log.error(err)
        const emailText = `Sherlock's best time`
        resolve({
          files: [photoURL],
          subject: `Sherlock photo of the day`,
          text: emailText
        })
      } else {
        // Parse the date portion from the exif date time and
        const split = exif.exif.DateTimeOriginal.split(' ')
        const photoDate = split[0].replace(/:/g, '-')
        const age = determineAge(new Date(photoDate))
        const emailText = `Sherlock's best time at age ${age}`
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
