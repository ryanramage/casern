const _get = require('lodash').get

module.exports = function (logger, db) {
  return {
    get: get.bind(null, logger, db),
    set: set.bind(null, logger, db)
  }
}

function get (logger, db, id, done) {
  let q = {
    startkey: `${id}|99999999999999999`,
    endkey: `${id}|0`,
    include_docs: true,
    descending: true,
    limit: 2
  }
  db.allDocs(q, (err, resp) => {
    if (err) return done(err)
    const state = {
      prev: null,
      current: null
    }
    if (resp.rows.length === 1) {
      state.currentDoc = _get(resp, 'rows[0].doc')
      state.current = state.currentDoc.state
      state.appliedData = _get(resp, 'rows[0].doc.data')
    }
    if (resp.rows.length === 2) {
      state.currentDoc = _get(resp, 'rows[0].doc')
      state.current = state.currentDoc.state
      state.appliedData = _get(resp, 'rows[0].doc.data')
      state.prev = _get(resp, 'rows[1].doc.state')
    }
    return done(null, state)
  })
}

function set (logger, db, id, currentDoc, state, data, to, done) {
  let now = Date.now()
  let doc = {
    _id: `${id}|${now}`,
    state,
    data,
    target: to
  }
  let docs = [doc]
  if (currentDoc) {
    currentDoc.stale = true
    docs.push(currentDoc)
  }
  db.bulkDocs(docs, done)
}
