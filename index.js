const config = require('./src/config')
const log = require('./src/log')
const email = require('./src/email')
const photos = require('./src/photos')
const storage = require('./src/storage')
const videos = require('./src/videos')

const run = async () => {
  try {
    let emailData
    const { file, fileType } = await storage.selectRandomFile()
    switch (fileType) {
      case storage.FileTypes.photo:
        emailData = await photos.getPhoto(file)
        break
      case storage.FileTypes.video:
        emailData = await videos.getVideo(file)
        break
      default:
        emailData = await photos.getPhoto(file)
    }
    await email.send(emailData, config.recipients, config.emailUserName, config.password)
  } catch (error) {
    log.error(error)
  }
}

run()
