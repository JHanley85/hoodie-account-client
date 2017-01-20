module.exports = signOut

var clone = require('lodash/clone')

var internals = module.exports.internals = {}
internals.request = require('../utils/request')
internals.get = require('./get')
internals.isSignedIn = require('./is-signed-in')
internals.generateId = require('../utils/generate-id')

function signOut (state) {
  return state.ready

      .then(function () {
        if (!internals.isSignedIn(state)) {
          throw new Error('UnauthenticatedError: Not signed in')
        }

        return state.hook('signout', function () {
          return internals.request({
            method: 'DELETE',
            url: state.url + '/session',
            headers: {
              authorization: 'Session ' + state.account.session.id
            }
          })

              .then(function () {
                return state.cache.unset()
              })

              .then(function () {
                var accountClone = clone(state.account)

                state.account = {
                  id: internals.generateId()
                }
                return state.cache.set(state.account)

                    .then(function () {
                      state.emitter.emit('signout', accountClone)

                      return accountClone
                    })
              })
        }).catch(function(err){
          if(err.error=="Unauthorized" && err.statusCode==401 && err.message=="Local changes could not be synced, sign in first"){
            console.error("Unauthorized to sign out, something wet wrong.");

            state.cache.unset()
            var accountClone = clone(state.account)

            state.account = {
              id: internals.generateId()
            }
            state.cache.set(state.account)
            state.emitter.emit('signout', accountClone)
            state=null;
          }
          console.error(err);

        })
      })
}
