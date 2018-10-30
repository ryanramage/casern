const async = require('async')
const _ = require('lodash')

module.exports = function (logger, targets, stateStore) {
  const q = async.queue(({target, data, stateID, to}, cb) => {
    logger.info({target, data, stateID, to}, 'task running')
    stateStore.get(stateID, (err, state) => {
      if (err) {
        logger.error({stateID, to}, err)
        return cb()
      }
      logger.info({stateID, state, to}, 'state loaded')
      try {
        let prevState = _.cloneDeep(state.current)
        let nextState = target(prevState, data)
        // if equal, dont store
        if (_.isEqual(state.current, nextState)) {
          logger.info({stateID, nextState, to}, 'reduced state is equal. not storing')
          return cb()
        }
        logger.info({stateID, nextState, to, state}, 'reduced state changed. storing')
        stateStore.set(stateID, state.currentDoc, nextState, data, to, (err) => {
          if (err) logger.error({stateID, to}, err)
          else logger.info({stateID, to}, 'new state stored')
          return cb()
        })
      } catch (e) {
        logger.error({stateID, to}, e)
        return cb()
      }
    })
  })
  const send = (to, stateID, data) => {
    let target = targets[to]
    if (!target) return logger.error({stateID, to}, `send called with ${to} but no target with that name exists`)
    if (!stateID || stateID.length === 0) return logger.error({stateID, to}, `no stateID provided`)
    q.push({target, data, stateID, to})
    logger.info({target, data, stateID, to}, 'pushing to queue')
  }
  return send
}
