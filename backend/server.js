const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

//import routingu
const authRoutes = require('./routes/authRoutes');

//middleware
app.use(cors());
app.use(bodyParser.json());

//routing
app.use('/api/auth', authRoutes);


//prosty testowy endpoint
app.get('/', (req, res) => {
  res.send('Serwer Express działa 🎉');
});

//start serwera
app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});
