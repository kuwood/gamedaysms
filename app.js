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
        res.sendStatus(201)
      }
    })
    .catch(err => console.log(err))
})

const checkDay = new cronJob('0 12 * * *', () => {
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
    // build list of teams playing
    if (res.data.count > 0) {
      let teamList = []
      res.data.event.forEach(event => {
        const away_team_id = event.away_team.team_id
        const home_team_id = event.home_team.team_id
        const away_team_full_name = event.away_team.full_name
        const home_team_full_name = event.home_team.full_name
        const {start_date_time} = event
        teamList.push({
          team_id: away_team_id,
          time: start_date_time,
          full_name: away_team_full_name,
        })
        teamList.push({
          team_id: home_team_id,
          time: start_date_time,
          full_name: home_team_full_name,
        })
      })
      return teamList
    } else {
      return []
    }
  })
  .then(list => {
    // Get numbers that are subscribed to each team
    console.log('----------')
    console.log(list)
    if (list.length === 0) return
    return Promise.all(list.map(team => {
      return ref.child('nba').child(team.team_id).once("value", data => data)
              .then(data => {
                team['numbers'] = data.val()
                return team
              })
    }))
    .then(teams => {
      // create an object for each number that has each each team
      // that it is subscribed to and is playing with event info
      console.log('----------')
      console.log(teams)
      let messageList = {}
      teams.forEach(team => {
        if (team.numbers === null || Object.keys(team.numbers).length < 1) return
        Object.keys(team.numbers).forEach(number => {
          const teamInfo = {
            team_id: team.team_id,
            time: team.time,
            full_name: team.full_name
          }
          if (messageList[number]) messageList[number].push(teamInfo)
          else messageList[number] = [teamInfo]
        })
      })
      return messageList
    })
    .then(messageList => {
      // for each number send message
      console.log('----------')
      console.log(messageList)
      if (Object.keys(messageList).length === 0 && messageList.constructor === Object) {
        console.log('no messages to send.')
        return
      }
      Object.keys(messageList).forEach(phoneNumber => {
        if (messageList[phoneNumber].length > 1) {
          // if subbed to multiple teams combine them into a message
          let message = []
          messageList[phoneNumber].forEach(team => {
            message.push(`${team.full_name} will play at ${team.time}.`)
          })
          client.messages.create({
            to: phoneNumber,
            from: process.env.YOURTWILIONUMBER,
            body: message.join(' ')
          })
            .then(message => console.log(err, message.sid)) 
        } else {
          // if only one team grab first event from array
          const time = messageList[phoneNumber][0].time
          const name = messageList[phoneNumber][0].full_name
          client.messages.create({
            to: phoneNumber,
            from: process.env.YOURTWILIONUMBER,
            body: `${name} will play at ${moment(time).format('h:mm A')} PST.`
          })
            .then(message => console.log(err, message.sid)) 
        }
      })
    })
  })
  .catch(err => console.log(err))
}, null, true)

  // TODO:
  // Phone number format verification

app.listen(3000, console.log('listening on 3000'))
