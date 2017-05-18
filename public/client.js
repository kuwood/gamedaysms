const inputSelector = document.getElementById('phone-input')
const leagueSelector = document.getElementById('league')
const teamSelector = document.getElementById('team')
const submitSelector = document.getElementById('phone-submit')
const formSelector = document.getElementById('phone-form')

formSelector.addEventListener('submit', (e) => {
  e.preventDefault()
  const league = leagueSelector.value
  const team = teamSelector.value
  const phoneNumber = `+${inputSelector.value}`
  const data = {league, team, phoneNumber}

  fetch(`/submit`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(data)
  })
    .then(response => console.log(response))
    .catch(err => console.error(err))

  console.log(phoneNumber)
  inputSelector.value = ""
})
