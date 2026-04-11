// session config
// production'da secure: true ve sameSite ayari yapilmali (https arkasinda)
module.exports = {
  secret: process.env.SESSION_SECRET || 'gizli-sofranet-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 gun
    httpOnly: true
    // secure: true, // https'de aktif et
  }
};
