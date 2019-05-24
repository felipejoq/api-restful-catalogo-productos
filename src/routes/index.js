const express = require('express');
const app = express();

app.get('/', (req, res) => {
    return res.status(200).json({
        ok: true,
        title: 'Catálogo de productos',
        description: 'Los productos que tenemos a su disposición en un solo lugar. Nuestro catálogo de productos.',
        copy: 'Catálogo de productos &copy; 2019',
        email: 'contacto@catalogo',
        phone: '+56 9 9999 9999',
        address: 'Chillán, Ñuble.'
    });
});

app.use('/api', require('./images'));
app.use('/api', require('./users'));
app.use('/api', require('./login'));

app.use('/api', require('./products'));


module.exports = app;