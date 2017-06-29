require('dotenv').config()
const accountSid = process.env.ACCOUNTSID
const authToken = process.env.AUTHTOKEN
const twilio = require('twilio')
const client = new twilio(accountSid, authToken)

const express = require('express')
const bodyParser = require('body-parser')
const app = express()

const admin = require('firebase-admin')
admin.initializeApp({
  credential: admin.credential.cert({
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: process.env.FIREBASE
})
const ref = admin.database().ref()

const dailyEventText = require('./dailyEventText')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

app.use(require('./routes'))

// runs job everyday at 12:05 PM PDT (5 minutes to ensure heroku dyno is awake)
dailyEventText.start()

  // TODO:
  // Phone number format verification
const port = process.env.PORT || 3000
app.listen(port, console.log(`listening on port ${port}`))
