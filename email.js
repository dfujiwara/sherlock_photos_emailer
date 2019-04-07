const gmailSend = require('gmail-send')
const log = require('./log')

const send = ({ photoURL, subject }, recipients, emailUserName, password) => {
  const sendEmail = gmailSend({
    user: emailUserName,
    pass: password,
    subject: subject,
    text: 'That\'s our Sherlock!',
    files: [photoURL]
  })
  const promises = recipients.map(recipient => {
    return new Promise((resolve, reject) =>
      sendEmail({
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

module.exports = { send }
