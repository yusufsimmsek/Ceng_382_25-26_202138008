// Sofranet - ana server dosyasi
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('Sofranet - hosgeldin! (kurulum asamasinda)');
});

app.listen(PORT, () => {
  console.log(`server calisiyor: http://localhost:${PORT}`);
});
