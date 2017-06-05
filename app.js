require('dotenv').config()
const accountSid = process.env.ACCOUNTSID
const authToken = process.env.AUTHTOKEN

const twilio = require('twilio')
const client = new twilio(accountSid, authToken)
const cronJob = require('cron').CronJob

const express = require('express')
const bodyParser = require('body-parser')
const app = express()

const axios = require('axios')
const moment = require('moment')

const admin = require('firebase-admin')

admin.initializeApp({
  credential: admin.credential.cert({
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: process.env.FIREBASE
})

const ref = admin.database().ref()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

app.post('/submit', (req, res) => {
  console.log(req.body)
  const {league, team, phoneNumber} = req.body
  const leagueRef = ref.child(league)

  leagueRef.once("value", res => res)
    .then(data => {
      const teams = data.val()
      // check if team exists
      if (!teams[team]) res.sendStatus(404)
      // check if number is already subscribed
      else if (teams[team][phoneNumber]) res.sendStatus(409)
      // add number
      else {
        leagueRef.child(team).update({
          [phoneNumber]: true
        })
        res.sendStatus(201)
      }
    })
    .catch(err => console.error(err))
})

// runs everyday at 12:05 PM PDT (5 minutes to ensure heroku dyno is awake)
const checkDay = new cronJob('5 12 * * *', () => {
  // check for games (currently only NBA)
  axios({
    method: 'get',
    url: 'https://erikberg.com/events.json?sport=nba',
    headers: {
      Authorization: ` Bearer ${process.env.XMLSTATSTOKEN}`
    }
  })
  .then(res => {
    console.log(res.data)
    // return events
    if (res.data.count > 0) return res.data.event
    else return Promise.reject('No events today')
  })
  .then(eventsArr => {
    // Get numbers that are subscribed to each team
    const events = eventsArr.map(event => {
      const teams = [event.home_team, event.away_team]
      const getNumbers = Promise.all(teams.map(team => {
        return ref.child('nba').child(team.team_id).once('value', data => data).then(data => data.val())
      }))
      .then(numbers => Object.assign({}, numbers[0],numbers[1]))
      .then(mergedNumbers => Object.assign({}, event, {numbers: mergedNumbers}))
      return getNumbers
    })
    return Promise.all(events)
  })
  .then(eventsWithNumbers => {
    // build object for each number that has a messageList of events
    const numbersWithEvents = eventsWithNumbers.reduce((acc, event) => {
      // iterate through numbers, check if num is in acc object, if so add event to numbersWithEvents
      // else create key pair with event
      Object.keys(event.numbers).forEach(num => {
        if (num === 'placeHolder') return
        else if (acc[num]) acc[num].events = [...acc[num].events, event]
        else acc[num] = {events: [event]}
      })
      return acc
    }, {})
    // check if object is empty
    if (Object.keys(numbersWithEvents).length === 0 && numbersWithEvents.constructor === Object) {
      return Promise.reject(`No numbers are subscribed to today's events`)
    }
    return numbersWithEvents
  })
  .then(messageObject => {
    // create message for each number with each event in the list
    Object.keys(messageObject).forEach(number => {
      const message = messageObject[number].events.map(event => (
        `${event.away_team.full_name} will play ${event.home_team.full_name} at ${moment.tz(event.start_date_time, `America/Los_Angeles`).format('h:mm A z')}.`))        
      client.messages.create({
        to: number,
        from: process.env.YOURTWILIONUMBER,
        body: message.join(' ')
      })
        .then(message => console.log(err, message.sid)) 
    })
  })
    .catch(err => console.log('error:', err))
}, null, true, 'America/Los_Angeles')

  // TODO:
  // Phone number format verification
const port = process.env.PORT || 3000
app.listen(port, console.log(`listening on port ${port}`))
