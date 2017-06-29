const router = require('express').Router()
const admin = require('firebase-admin')

const ref = admin.database().ref()

router.post('/submit', (req, res) => {
  console.log(req.body)
  const {league, team, phoneNumber} = req.body
  const leagueRef = ref.child(league)

  leagueRef.once("value", res => res)
    .then(data => {
      const teams = data.val()
      // check if team exists
      if (!teams[team]) return res.status(404).json({
        message: 'Failed: Sorry, we cannot find that team.'
      })
      // check if number is already subscribed
      else if (teams[team][phoneNumber]) return res.status(409).json({
        message: 'Failed: You are already subscribed to that team.'
      })
      // add number
      else {
        leagueRef.child(team).update({
          [phoneNumber]: true
        })
        return res.status(201).json({
          message: 'Success!'
        })
      }
    })
    .catch(err => console.error(err))
})

module.exports = router