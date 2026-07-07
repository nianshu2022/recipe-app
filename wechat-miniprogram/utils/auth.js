const sync = require('./sync')

module.exports = {
  getCurrentUser: sync.getCurrentUser,
  isLoggedIn: sync.isLoggedIn,
  login: sync.login,
  logout: sync.logout,
  register: sync.register,
  fullSync: sync.fullSync,
}
