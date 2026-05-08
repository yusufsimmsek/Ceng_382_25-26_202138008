// log service - logs tablosuna kayit
const db = require('../config/db');

// kullanilan action stringleri (dokuman amacli, inline kullanim da OK):
// LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT, USER_REGISTERED,
// ORDER_CREATED, ORDER_STATUS_CHANGED, PAYMENT_PROCESSED, PAYMENT_FAILED,
// RATING_SUBMITTED, EMAIL_SENT, EMAIL_FAILED,
// MENU_CREATED, MENU_UPDATED, MENU_DELETED,
// ADMIN_ACTION, ERROR

async function logAction(req, action, details = '') {
  try {
    const userId = (req && req.session && req.session.user) ? req.session.user.id : null;
    const ipAddress = req
      ? (req.ip || req.headers['x-forwarded-for'] || (req.connection && req.connection.remoteAddress) || null)
      : null;

    await db.query(
      'INSERT INTO logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [userId, action, details || null, ipAddress]
    );
  } catch (err) {
    // Log gonderimi basarisiz olursa uygulama bozulmasin, sadece console
    console.error('Log kaydi basarisiz:', err.message);
  }
}

function logError(req, error, context = '') {
  const stack = error.stack ? error.stack.split('\n')[0] : '';
  const details = `${context} | ${error.message} | ${stack}`.substring(0, 1000);
  return logAction(req, 'ERROR', details);
}

module.exports = { logAction, logError };
