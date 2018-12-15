const config = require('./config')
const gmailSend = require('gmail-send')
const {Storage} = require('@google-cloud/storage');

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
        subject: 'Random Sherlock Photo',
        text: 'Look at Sherlock!',
        files: [photoURL]
    })
    recipients.forEach(recipient => {
        send({
            to: recipient
        }, (err, res) => {
            console.log('send() callback returned: err:', err, '; res:', res)
        })
    })
}

selectRandomPhoto()
    .then(file => {
        return getPhoto(file)
    })
    .then(photoURL => {
        sendEmail(photoURL, config.recipients)
    })
    .catch((error) => {
        console.log(error)
    })
