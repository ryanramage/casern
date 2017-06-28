const createStateStore = require('../lib/createStateStore')
const test = require('tape')

test('cb an error if pouch fails', t => {
  let logger = {info: console.log, error: console.log}
  let db = {
    allDocs: (q, cb) => cb(new Error('bad things'))
  }
  let sendStore = createStateStore(logger, db)
  sendStore.get('1234', err => {
    t.ok(err)
    t.end()
  })
})
