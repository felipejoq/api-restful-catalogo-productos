const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Home');
});

app.use('/api', require('./users'));
app.use('/api', require('./login'));

app.use('/api', require('./products'));
app.use('/api', require('./images'));

module.exports = app;