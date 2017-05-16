const config = require('./config.js').config
const accountSid = config.ACCOUNTSID
const authToken = config.AUTHTOKEN

const twilio = require('twilio')
const client = new twilio(accountSid, authToken)
const cronJob = require('cron').CronJob


const checkDay = new cronJob('0 12 * * *', () => {
  client.messages.create({
    to: config.TESTPHONENUMBER,
    from: config.YOURTWILIONUMBER,
    body:'Test!'
  })
    .then(message => console.log(err, message.sid))  
}, null, true)

