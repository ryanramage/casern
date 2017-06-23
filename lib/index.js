const eachLimit = require('async').eachLimit
const createSend = require('./createSend')
const createStateStore = require('./createStateStore')

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
  follow.on('error', err => services.logger.error(err))
  follow.on('change', change => {
    if (change.doc.stale) return // ignore the stale doc change.
    let _id = change.id.split('|').slice(0, -1).join('|')
    services.logger.info({_id}, 'state change, calling listeners')
    stateStore.get(_id, (err, state) => {
      if (err) return services.logger.error(err)
      services.logger.info({_id, state: JSON.stringify(state)}, 'state ready for listeners')
      eachLimit(stateChangesKeys, 1, (key, cb) => {
        services.logger.info({listener: key, _id}, 'calling listener')
        stateChangeListeners[key](state.prev, state.current, state.appliedData, _id, cb)
      })
    })
  })
  return {send, follow}
}
