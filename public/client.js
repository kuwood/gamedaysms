const inputSelector = document.getElementById('phone-input')
const leagueSelector = document.getElementById('league')
const teamSelector = document.getElementById('team')
const formSelector = document.getElementById('phone-form')
const feedbackSelector = document.getElementById('feedback')
const messageSelector = document.getElementById('message')

formSelector.addEventListener('submit', e => {
  e.preventDefault()
  const league = leagueSelector.value
  const team = teamSelector.value
  const phoneNumber = `+${inputSelector.value}`
  const payload = {league, team, phoneNumber}

  fetch(`/api/submit`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(payload)
  })
    .then(response => {
      return response.json().then(data => ({message: data.message, ok: response.ok}))
    })
    .then(response => {
      if (response.ok) {
        messageSelector.innerText = response.message
        feedbackSelector.classList.remove('fail', 'hide')
        feedbackSelector.classList.add('success')
      } else {
        messageSelector.innerText = response.message
        feedbackSelector.classList.remove('success', 'hide')
        feedbackSelector.classList.add('fail')
      }
    })
    .catch(err => console.error(err))

  inputSelector.value = ""
})
