const config = require('./config')
const gmailSend = require('gmail-send')
const {Storage} = require('@google-cloud/storage');
const log = require('simple-node-logger').createSimpleLogger({level: 'all'})

const storage = new Storage({
    projectId: config.projectId
});

const selectRandomPhoto = async () => {
    const [files] = await storage.bucket(config.storageBucketName).getFiles();
    const randomIndex = Math.floor(Math.random() * files.length)
    return files[randomIndex]
}

const getPhoto = async (file) => {
    const fileURL = './photo.jpeg'
    await storage
        .bucket(config.storageBucketName)
        .file(file.name)
        .download({destination: './photo.jpeg'})
    return fileURL
}

const sendEmail = (photoURL, recipients) => {
    const send = gmailSend({
        user: config.emailUserName,
        pass: config.password,
        subject: 'Sherlock photo of the day',
        text: 'That\'s our Sherlock!',
        files: [photoURL]
    })
    const promises = recipients.map(recipient => {
        return new Promise((resolve, reject) =>
            send({
                to: recipient
            }, (err, res) => {
                if (err != null) {
                    reject(err)
                } else {
                    log.info('success sending email!')
                    resolve(res)
                }
            })
        )
    })
    return Promise.all(promises)
}

selectRandomPhoto()
    .then(file => {
        return getPhoto(file)
    })
    .then(photoURL => {
        return sendEmail(photoURL, config.recipients)
    })
    .catch((error) => {
        log.error(error)
    })
