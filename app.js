require('dotenv').config()
const accountSid = process.env.ACCOUNTSID
const authToken = process.env.AUTHTOKEN

const twilio = require('twilio')
const client = new twilio(accountSid, authToken)
const cronJob = require('cron').CronJob

const express = require('express')
const bodyParser = require('body-parser')
const app = express()

app.use(bodyParser.json())

app.use(express.static('public'))

app.post('/submit/:phoneNumber', (req, res) => {
  console.log(req.params.phoneNumber)
  if (req.params.phoneNumber === process.env.TESTPHONENUMBER) {
    client.messages.create({
      to: process.env.TESTPHONENUMBER,
      from: process.env.YOURTWILIONUMBER,
      body:'Test!'
    })
      .then(message => console.log(err, message.sid))  
    res.sendStatus(201)
  }
  else res.sendStatus(400)
})

// build and connect firebase DB
// setup xmlstats api

const checkDay = new cronJob('0 12 * * *', () => {
  client.messages.create({
    to: process.env.TESTPHONENUMBER,
    from: process.env.YOURTWILIONUMBER,
    body:'Test!'
  })
    .then(message => console.log(err, message.sid))  
}, null, true)

app.listen(3000, console.log('listening on 3000'))