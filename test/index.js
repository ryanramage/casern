const casern = require('../lib/index')
const test = require('tape')
const PouchDB = require('./pouchdb/pouchdb-memory')

test('basic send and stateChangeListeners', t => {
  let statedb = new PouchDB('statedb1')
  let preferences = {}
  let services = {}
  let reducers = {
    test: (preferences, state, data) => {
      t.equals(data.bumpHappy, 1)
      t.equals(state, null)
      return { happy: (1 + data.bumpHappy) }
    }
  }
  let _dispose = null
  let stateChangeListeners = {
    final: (preferences, services, send, prev, current, appliedData, _id, cb) => {
      t.deepEquals(prev, null)
      t.equals(current.happy, 2)
      t.equals(_id, 'id123')
      _dispose(() => {
        statedb.destroy()
        t.end()
      })
    }
  }
  let {send, dispose} = casern(statedb, preferences, services, reducers, stateChangeListeners)
  _dispose = dispose
  send('test', 'id123', {bumpHappy: 1})
})

test('ignore the stale state', t => {
  let statedb = new PouchDB('statedb2')
  let preferences = {}
  let services = {
    logger: {info: console.log, error: console.log}
  }
  let reducers = {
    test: (preferences, state, data) => {
      let initialHappy = 1
      if (state && state.happy) initialHappy = state.happy
      let newHappy = initialHappy + data.bumpHappy
      return { happy: newHappy }
    }
  }
  let _dispose = null
  let stateChangeListeners = {
    first: (preferences, services, send, prev, current, appliedData, _id, cb) => {
      if (prev) return cb()
      t.equals(current.happy, 2)
      send('test', 'id123', {bumpHappy: 2})
      cb()
    },
    final: (preferences, services, send, prev, current, appliedData, _id, cb) => {
      if (!prev || !current) return cb()
      t.deepEquals(prev, {happy: 2})
      t.equals(current.happy, 4)
      t.equals(_id, 'id123')
      _dispose(() => {
        statedb.destroy()
        t.end()
      })
    }
  }
  let {send, dispose} = casern(statedb, preferences, services, reducers, stateChangeListeners)
  _dispose = dispose
  send('test', 'id123', {bumpHappy: 1})
})
