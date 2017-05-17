require('dotenv').config()
const accountSid = process.env.ACCOUNTSID
const authToken = process.env.AUTHTOKEN

const twilio = require('twilio')
const client = new twilio(accountSid, authToken)
const cronJob = require('cron').CronJob

const express = require('express')
const bodyParser = require('body-parser')
const app = express()

const admin = require('firebase-admin')
const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE
})

const ref = admin.database().ref()
const nbaRef = ref.child('nba')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

app.post('/submit', (req, res) => {
  console.log(req.body)
  const {league, team, phoneNumber} = req.body
  const queryRef = ref.child(league).child(team)

  queryRef.once("value", data => data)
    .then(data => {
      const numbers = data.val()

      if (numbers[phoneNumber]) {
        res.sendStatus(409)
      }
      else {
        // add number
        nbaRef.child('golden-state-warriors').update({
          [phoneNumber]: true
        })
        // client.messages.create({
        //   to: process.env.TESTPHONENUMBER,
        //   from: process.env.YOURTWILIONUMBER,
        //   body:'Test!'
        // })
          // .then(message => console.log(err, message.sid))
        res.sendStatus(201)
      }
    })
    .catch(err => console.log(err))
})

const checkDay = new cronJob('0 12 * * *', () => {
  // check for games
  // for each team, get number list,
  // for each number send message
  client.messages.create({
    to: process.env.TESTPHONENUMBER,
    from: process.env.YOURTWILIONUMBER,
    body:'CronJob Test!'
  })
    .then(message => console.log(err, message.sid))  
}, null, true)

app.listen(3000, console.log('listening on 3000'))
