const stateChangeFollower = require('../lib/stateChangeFollower')
const test = require('tape')

test('if the state store errors, it is logged', t => {
  let logger = {
    info: console.log,
    error: (err) => {
      t.ok(err)
      t.end()
    }}
  let services = {logger}
  let stateStore = {
    get: (id, cb) => cb(new Error('bad things'))
  }
  let stateChangeListeners = {}
  let change = {
    id: 'id1234|32233232',
    doc: {}
  }
  stateChangeFollower(stateStore, services, stateChangeListeners, change)
})
