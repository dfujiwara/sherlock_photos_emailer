const config = require('./config')
const gmailSend = require('gmail-send')

const send = gmailSend({
    user: config.emailUserName,
    pass: config.password,
    to:   config.emailUserName,
})

send({
    subject: 'test subject',
    text:    'gmail-send example'
}, (err, res) => {
    console.log('* [example 1.1] send() callback returned: err:', err, '; res:', res)
})