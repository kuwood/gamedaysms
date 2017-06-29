const inputSelector = document.getElementById('phone-input')
const leagueSelector = document.getElementById('league')
const teamSelector = document.getElementById('team')
const submitSelector = document.getElementById('phone-submit')
const formSelector = document.getElementById('phone-form')
const feedbackSelector = document.getElementById('feedback')
const messageSelector = document.getElementById('message')

formSelector.addEventListener('submit', (e) => {
  e.preventDefault()
  const league = leagueSelector.value
  const team = teamSelector.value
  const phoneNumber = `+${inputSelector.value}`
  const data = {league, team, phoneNumber}

  fetch(`/api/submit`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(data)
  })
    .then(data => {
      console.log(data.status, data.statusText)
      return data.json()
    })
    .then(response => {
      const {message} = response 
      if (message[0] !== "F") {
        messageSelector.innerHTML = message
        feedbackSelector.classList.remove('fail', 'hide')
        feedbackSelector.classList.add('success')
      } else {
        messageSelector.innerHTML = message
        feedbackSelector.classList.remove('success', 'hide')
        feedbackSelector.classList.add('fail')
      }
    })
    .catch(err => console.error(err))

  console.log(phoneNumber)
  inputSelector.value = ""
})
