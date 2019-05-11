const storage = require('./storage')
const genThumbnail = require('simple-thumbnail')

const getVideo = async (file) => {
  const fileURL = './photo.mov'
  const thumbnailURL = './video_thumbnail.png'
  await storage.download(file, fileURL)
  await genThumbnail(fileURL, thumbnailURL, '200x?')
  return new Promise((resolve, reject) => {
    resolve({
      files: [thumbnailURL],
      subject: `Sherlock video of the day`,
      text: `Sherlock's best time at ${file.metadata.mediaLink}`
    })
  })
}

module.exports = { getVideo }
