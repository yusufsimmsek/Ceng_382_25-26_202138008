// auth middleware'leri

function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    req.flash('error', 'Bu sayfaya erişmek için giriş yapmalısın');
    return res.redirect('/login');
  }
  next();
}

function requireRole(role) {
  // role string olabilir veya array
  const allowed = Array.isArray(role) ? role : [role];
  return function (req, res, next) {
    const u = req.session && req.session.user;
    if (!u || !allowed.includes(u.role)) {
      req.flash('error', 'Bu sayfaya erişim yetkin yok');
      return res.redirect('/');
    }
    next();
  };
}

module.exports = { requireLogin, requireRole };
