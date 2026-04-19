// caterer controller
// const db = require('../config/db'); // sonra istatistik query'leri icin acilacak

async function dashboard(req, res) {
  try {
    // TODO: gercek istatistikleri DB'den cek (faz 9)
    const stats = {
      totalOrders: 0,
      completed: 0,
      avgRating: null,
      revenue: 0
    };

    res.render('caterer/dashboard', { title: 'Dashboard', stats });
  } catch (err) {
    console.error('caterer dashboard error:', err);
    res.status(500).send('Sunucu hatasi');
  }
}

module.exports = { dashboard };
