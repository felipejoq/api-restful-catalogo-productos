const router = require('express').Router();
const fs = require('fs');
const path = require('path');

/**
 * Esta ruta devuelve una imagen solicitada hacia el cliente.
 * Para pedir la imagen debe tenerse el tipo (producto) y su nombre.
 * El nombre va adozado al atributo img del producto.
 * Si la imagen existe, el recurso devuelve un archivo con el path de la imagen solicitada.
 */
router.get('/image/:tipo/:img', (req, res) => {

    let tipo = req.params.tipo;
    let img = req.params.img;

    let pathImg = path.resolve(__dirname, `../../src/uploads/${tipo}/${img}`);

    if (fs.existsSync(pathImg)) {

        res.sendFile(pathImg);

    } else {
        let noImgPath = path.resolve(__dirname, '..//assets/no-image.jpg');
        res.sendFile(noImgPath);
    }

});


module.exports = router;