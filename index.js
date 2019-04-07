const config = require('./config')
const log = require('./log')
const email = require('./email')
const photos = require('./photos')
const storage = require('./storage')

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
