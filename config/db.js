// postgres baglanti
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// baslangicta test edelim
pool.connect((err, client, release) => {
  if (err) {
    console.error('DB baglanti hatasi:', err.message);
    return;
  }
  console.log('postgres connected');
  release();
});

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
