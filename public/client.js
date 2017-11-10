const inputSelector = document.getElementById('phone-input')
const leagueSelector = document.getElementById('league')
const teamSelector = document.getElementById('team')
const formSelector = document.getElementById('phone-form')
const feedbackSelector = document.getElementById('feedback')
const messageSelector = document.getElementById('message')
let feedbackTimeout;

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
      feedbackHandler(response)
    })
    .catch(err => console.error(err))
})

function feedbackHandler(response) {
  clearTimeout(feedbackTimeout)
  messageSelector.innerText = response.message
  if (response.ok) {
    messageSelector.classList.remove('fail')
    messageSelector.classList.add('success')
  } else {
    messageSelector.classList.remove('success')
    messageSelector.classList.add('fail')
  }
  feedbackSelector.classList.remove('hide')
  feedbackTimeout = setTimeout(() => {
    feedbackSelector.classList.add('hide')
  }, 4000);
}
