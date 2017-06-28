const createSend = require('./createSend')
const createStateStore = require('./createStateStore')
const stateChangeFollower = require('./stateChangeFollower')

module.exports = function (statedb, preferences, services, reducers, stateChangeListeners) {
  if (!services.logger) services.logger = { info: console.log, error: console.log }

  // setup reducers
  // bind the config
  Object.keys(reducers).forEach(key => {
    reducers[key] = reducers[key].bind(null, preferences)
  })
  services.logger.info(Object.keys(reducers), 'reducers loaded')

  // create the send
  const stateStore = createStateStore(services.logger, statedb)
  const send = createSend(services.logger, reducers, stateStore)
  services.logger.info('stateStore and send initialized')

  // setup onStateChanges
  const stateChangesKeys = Object.keys(stateChangeListeners)
  // bind the config and send
  stateChangesKeys.forEach(key => {
    stateChangeListeners[key] = stateChangeListeners[key].bind(null, preferences, services, send)
  })
  services.logger.info(stateChangesKeys, 'stateChange listeners loaded')

  const changesOpts = {
    since: 'now',
    live: true,
    include_docs: true
  }
  const follow = statedb.changes(changesOpts)
  follow.on('change', change => stateChangeFollower(stateStore, services, stateChangeListeners, change))
  let dispose = (cb) => {
    follow.on('complete', () => cb())
    follow.cancel()
  }
  return {send, follow, dispose}
}
