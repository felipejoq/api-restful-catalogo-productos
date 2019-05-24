const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');

// Configuraciones
app.set('port', process.env.PORT || 3000);

//Middlewares
app.use(cors({origin: 'http://localhost:4200', optionsSuccessStatus: 200}));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Conectar con DB
require('./db/dbconfig');

// Rutas
app.use(require('./routes/index'));

// Path público
app.use(express.static(path.join(__dirname, 'public')));

// Iniciando el servidor
app.listen(app.get('port'), (err) => {
    (err) ? console.log(err): console.log('Ir a http://localhost:' + app.get('port'));
});