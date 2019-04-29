const config = require('./src/config')
const log = require('./src/log')
const email = require('./src/email')
const photos = require('./src/photos')
const storage = require('./src/storage')

const run = async () => {
  try {
    const { file } = await storage.selectRandomFile()
    const photoData = await photos.getPhoto(file)
    await email.send(photoData, config.recipients, config.emailUserName, config.password)
  } catch (error) {
    log.error(error)
  }
}

run()
