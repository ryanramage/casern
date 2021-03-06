# casern

[![Build Status](https://secure.travis-ci.org/ryanramage/casern.svg?branch=master)](http://travis-ci.org/ryanramage/casern) TAP 💯 club

unidirectional data-flow manager for persistent, multi-tenant state machines

Casern is for server side redux, when you need a lot of little state machines. For example handling chatbot states across thousands of conversations.

This project has been used succesfully for 1000's of parallel chatbot states.

The structure of data flow is based on [barracks](https://www.npmjs.com/package/barracks). In casern, the state is persistent, and you can have many state machines.

"A casern is a military barracks in a garrison town"

## Module Usage

```
npm install casern
```

```
const casern = require('casern')
const PouchDB = require('pouchdb')
const yourEmailSender = require('yourEmailSender')

let preferences = {
  supportPerson: 'bob@help.com'
  timeoutAfter: 10000
}
let services = {
  sendEmail: (emailAddress, msg, done) => yourEmailSender(emailAddress, msg, done)
}
let reducers = {
  initialInquiry: (preferences, state, data) => {
    let nextState = {}
    nextState.status = 'inquired'
    nextState.name = data.name
    nextState.when = Date.now()
    return nextState
  }
  checkTimeout: (preferences, state, data) => {
    if (!data.now) return state // we need the current time to be passed to us so we are a pure, side-effect free function
    if (state.status === 'timeout') return state // ignore some existing states
    if (state.when + preferences.timeoutAfter > data.now) state.status = 'timeout'
    return state
  }
}
let stateChangeListeners = {
  emailSupport: (preferences, services, send, prevState, currentState, appliedDate, stateID, done) => {
    if (currentState.status === 'timeout') {
      services.sendEmail(preferences.supportPerson, `The person ${currentState.name} has not responded`, done)
    }
  }
}
let statedb = new PouchDB('statedb')
const {send} = casern(statedb, preferences, services, reducers, stateChangeListeners)

// for now, lets just show one thing to track state of
let someId = '12344'
let inquiry = { name: 'ryan' }
send('initialInquiry', someId, inquiry) // create an initialInquiry by sending to the reducer
setInterval(
  () => send('checkTimeout', someId, {now: Date.now()}), // call the checkTimeout reducer
1000) // pulse this enquiry every second

```

## License

MIT
