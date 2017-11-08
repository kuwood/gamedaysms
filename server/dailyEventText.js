const accountSid = process.env.ACCOUNTSID
const authToken = process.env.AUTHTOKEN
const twilio = require('twilio')
const client = new twilio(accountSid, authToken)
const axios = require('axios')
const moment = require('moment')
const admin = require('firebase-admin')
const cronJob = require('cron').CronJob

const ref = admin.database().ref()

// runs everyday at 12:05 PM PDT (5 minutes to ensure heroku dyno is awake)
const dailyEventText = new cronJob('5 12 * * *', () => {
  // check for games (currently only NBA)
  axios({
    method: 'get',
    url: 'https://erikberg.com/events.json?sport=nba',
    headers: {
      Authorization: ` Bearer ${process.env.XMLSTATSTOKEN}`
    }
  })
  .then(res => {
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
      const numbers = Object.keys(event.numbers)
      const numbersLength = numbers.length
      for (let i = 0; i < numbersLength; i++) {
        let number = numbers[i]
        if (number === 'placeHolder') return
        else if (acc[number]) acc[number].events = [...acc[number].events, event]
        else acc[number] = {events: [event]}
      }
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
    const numbers = Object.keys(messageObject)
    const numbersLength = numbers.length
    for (let i = 0; i < numbersLength; i++) {
      const number = numbers[i]
      const message = messageObject[number].events.map(event => (
        `${event.away_team.full_name} will play ${event.home_team.full_name} at
         ${moment.tz(event.start_date_time, `America/Los_Angeles`)
         .format('h:mm A z')}.`
      ))
      client.messages.create({
        to: number,
        from: process.env.YOURTWILIONUMBER,
        body: message.join(' ')
      })
      .then(message => console.log(message.sid))
      .catch(err => console.error('Error creating SMS message', err))
    }
  })
  .catch(err => console.log('error:', err))
}, null, true, 'America/Los_Angeles')

module.exports = dailyEventText
