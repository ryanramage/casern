const _ = require('lodash')
const eachLimit = require('async').eachLimit

module.exports = function (stateStore, services, stateChangeListeners, change) {
  if (change.doc.stale) return // ignore the stale doc change.
  let _id = change.id.split('|').slice(0, -1).join('|')
  services.logger.info({_id}, 'state change, calling listeners')
  stateStore.get(_id, (err, state) => {
    if (err) return services.logger.error(err)
    services.logger.info({_id, state: JSON.stringify(state)}, 'state ready for listeners')
    eachLimit(Object.keys(stateChangeListeners), 1, (key, cb) => {
      services.logger.info({listener: key, _id}, 'calling listener')
      let isolatedState = _.cloneDeep(state)
      stateChangeListeners[key](isolatedState.prev, isolatedState.current, isolatedState.appliedData, _id, cb)
    })
  })
}
