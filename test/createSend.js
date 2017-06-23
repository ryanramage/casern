const test = require('tape')
const createSend = require('../lib/createSend')

const dataToSend = {
  toAddToA: 100
}
const oldState = {
  a: 1, b: 2
}
const _newState = {
  a: 101, b: 2
}

test('basic create send', (t) => {
  const logger = {
    error: () => t.fail,
    info: console.log
  }
  const targets = {
    callmeMaybe: (state, data) => {
      t.ok(state)
      t.deepEqual(state, oldState)
      t.ok(data)
      t.deepEqual(data, dataToSend)
      return _newState
    }
  }
  const stateStore = {
    get: (id, done) => done(null, { current: oldState, prev: null }),
    set: (id, currentDoc, nextState, data, done) => {
      t.deepEqual(nextState, _newState)
      done()
      t.end()
    }
  }
  const send = createSend(logger, targets, stateStore)
  send('callmeMaybe', '1234', dataToSend)
})

test('send throws an error is handled', (t) => {
  const logger = {
    error: (details, exception) => {
      t.ok(details)
      t.ok(exception)
      t.end()
    },
    info: console.log
  }
  const targets = {
    callmeMaybe: (state, data) => {
      state.never.here.is.not.gonna.work = 2
    }
  }
  const stateStore = {
    get: (id, done) => done(null, { current: oldState, prev: null }),
    set: (id, currentDoc, nextState, data, done) => {
      t.deepEqual(nextState, _newState)
      t.end()
    }
  }
  const send = createSend(logger, targets, stateStore)
  send('callmeMaybe', '1234', dataToSend)
})

test('stateStore get throws an error is handled', (t) => {
  const logger = {
    error: (details, exception) => {
      t.ok(details)
      t.ok(exception)
      t.end()
    },
    info: console.log
  }
  const targets = {
    callmeMaybe: (state, data) => {
      state.never.here.is.not.gonna.work = 2
    }
  }
  const stateStore = {
    get: (id, done) => done('bad things'),
    set: (id, currentDoc, nextState, done) => {
      t.deepEqual(nextState, _newState)
      t.end()
    }
  }
  const send = createSend(logger, targets, stateStore)
  send('callmeMaybe', '1234', dataToSend)
})

test('stateStore set throws an error is handled', (t) => {
  const logger = {
    error: (details, exception) => {
      t.ok(details)
      t.ok(exception)
      t.end()
    },
    info: console.log
  }
  const targets = {
    callmeMaybe: (state, data) => {
      return _newState
    }
  }
  const stateStore = {
    get: (id, done) => done(null, { current: oldState, prev: null }),
    set: (id, currentDoc, nextState, data, done) => {
      done('bad things')
    }
  }
  const send = createSend(logger, targets, stateStore)
  send('callmeMaybe', '1234', dataToSend)
})

test('invaild target is handled', (t) => {
  const logger = {
    error: (details, message) => {
      t.equals(details.stateID, '1234')
      t.ok(message)
      t.end()
    },
    info: console.log
  }
  const targets = {
    callmeMaybe: (state, data) => {}
  }
  const stateStore = {
    get: (id, done) => done(null, { current: oldState, prev: null }),
    set: (id, currentDoc, nextState, data, done) => {
      t.deepEqual(nextState, _newState)
      t.end()
    }
  }
  const send = createSend(logger, targets, stateStore)
  send('callmeMaybeSOWRONG', '1234', dataToSend)
})

test('state is not stored if reduce does not change it', (t) => {
  const logger = {
    error: () => t.fail,
    info: (obj, msg) => {
      if (msg === 'reduced state is equal. not storing') t.end()
    }
  }
  const targets = {
    callmeMaybe: (state, data) => {
      t.ok(state)
      t.deepEqual(state, oldState)
      return state
    }
  }
  const stateStore = {
    get: (id, done) => done(null, { current: oldState, prev: null }),
    set: (id, currentDoc, nextState, data, done) => {
      t.fail('we should not call set')
    }
  }
  const send = createSend(logger, targets, stateStore)
  send('callmeMaybe', '1234', dataToSend)
})

test('need a valid state id', t => {
  const logger = {
    error: () => t.end(),
    info: console.log
  }
  const targets = {
    callmeMaybe: (state, data) => state
  }
  const stateStore = {
    get: (id, done) => done(null, { current: oldState, prev: null }),
    set: (id, currentDoc, nextState, data, done) => {
      t.fail('we should not call set')
    }
  }
  const send = createSend(logger, targets, stateStore)
  send('callmeMaybe', null, dataToSend)
})
