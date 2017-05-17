const inputSelector = document.getElementById('phone-input')
const submitSelector = document.getElementById('phone-submit')
const formSelector = document.getElementById('phone-form')

formSelector.addEventListener('submit', (e) => {
  e.preventDefault()
  const phoneNumber = inputSelector.value

  fetch(`/submit/${phoneNumber}`, {
    method: 'POST',
    body: phoneNumber
  })
    .then(response => console.log(response))
    .catch(err => console.error(err))

  console.log(phoneNumber)
  inputSelector.value = ""
})
