// Sofranet - ana server dosyasi
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const sessionConfig = require('./config/session');
require('./config/db'); // baglanti testi icin require yeterli

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// static
app.use(express.static(path.join(__dirname, 'public')));

// body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// method override - form'larda _method=DELETE/PUT kullanmak icin
app.use(methodOverride('_method'));
app.use(methodOverride((req, res) => {
  // body icinde de bakabilsin
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const m = req.body._method;
    delete req.body._method;
    return m;
  }
}));

// session + flash
app.use(session(sessionConfig));
app.use(flash());

// view'lere kullaniciyi ve flash mesajlari gec
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.messages = {
    success: req.flash('success'),
    error: req.flash('error'),
    info: req.flash('info')
  };
  next();
});

// routes
app.get('/', (req, res) => {
  res.render('home', { title: 'Anasayfa' });
});

app.use('/', authRoutes);

// 404
app.use((req, res) => {
  res.status(404).send('Sayfa bulunamadi');
});

// global error handler
app.use((err, req, res, next) => {
  console.error('hata:', err);
  res.status(500).send('Sunucu hatasi');
});

app.listen(PORT, () => {
  console.log(`server calisiyor: http://localhost:${PORT}`);
});
