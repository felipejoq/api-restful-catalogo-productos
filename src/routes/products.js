const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const Producto = require('../models/Product');

const { verificaToken, verificaAdmin_Role } = require('../middlewares/auth');

const app = express();

// Middleware para el manejo de los archivos enviados
app.use(fileUpload());

/**
 * Entrega una lista completa de todos los objetos o documentos productos
 * Se puede paginar pidiendo o solicitando con parámetros from y limit.
 * Obtener los productos en papelera enviar parámetro status en false
 */
app.get('/product', (req, res) => {
    let status = req.query.status || true;

    let from = req.query.from || 0;
    from = Number(from);

    let limit = req.query.limit || 5;
    limit = Number(limit);

    Producto.find({ status })
        .skip(from)
        .limit(limit)
        .populate('user')
        .exec((err, products) => {
            if (err) {
                return res.status(400).json({ ok: false, errors: err });
            }

            Producto.countDocuments({}, (err, count) => {
                if (err) {
                    return res.status(400).json({ ok: false, errors: err });
                }
                return res.json({ ok: true, products, count });
            });
        });
});

/**
 * Recurso que devuelve el objeto o documento Producto
 * según la ID especificada en la UDL
 */
app.get('/product/:id', (req, res) => {
    let id = req.params.id;

    Producto.findById(id)
        .populate('user')
        .exec((err, product) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    message: 'Error o el producto solicitado no existe',
                    errors: err
                });
            }

            return res.status(200).json({
                ok: true,
                product
            });
        });

});

// Middleware de protección de recurso mediante token y rol.
app.use([verificaToken, verificaAdmin_Role]);

/**
 * Método que crea un recurso o documento del tipo Producto en la base de datos.
 */
app.post('/product', (req, res) => {
    let body = req.body;

    if (!req.files) {
        return res.status(400).json({
            ok: false,
            errors: {
                message: 'Debe agregar al menos una imagen.'
            }
        });
    }

    if (Number(body.discount || 0) > Number(body.price || 0)) {
        return res.status(400).json({
            ok: false,
            errors: {
                message: 'El descuento no puede ser mayor que el precio del producto.'
            }
        });
    }

    let product = new Producto();
    Object.keys(req.body).forEach(key => {
        product[key] = req.body[key];
    });

    product.final_price = finalPriceCalculate(body.price, body.discount);
    product.img = uploadImgProduct(req, res);

    product.save((err, productSaved) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                errors: err
            });
        }

        return res.status(201).json({
            ok: true,
            product: productSaved
        });
    });

});

app.put('/product/:id', (req, res) => {

    let id = req.params.id;

    Producto.findById(id, (err, product) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                message: 'Error al buscar el producto o ID incorrecta, intente nuevamente.',
                errors: err
            });
        }

        if (req.body.price || req.body.discount) {
            if (Number(req.body.discount || product.discount) > Number(req.body.price || product.price)) {
                return res.status(400).json({
                    ok: false,
                    errors: {
                        message: 'El descuento no puede ser mayor que el precio del producto.'
                    }
                });
            } else {
                product.final_price = finalPriceCalculate(req.body.price || product.price, req.body.discount || product.discount);
            }
        }

        Object.keys(req.body).forEach(key => {
            product[key] = req.body[key];
        });

        if (req.files) {
            product.img = uploadImgProduct(req, res, product);
        }

        product.save((err, productSaved) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    errors: err
                });
            }

            return res.status(201).json({
                ok: true,
                product: productSaved
            });
        });
    })

});

app.delete('/product/:id', (req, res) => {

    let id = req.params.id;
    let body = req.body;

    Producto.findById(id, (err, product) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                errors: err
            });
        }

        if (!product) {
            return res.status(400).json({
                ok: false,
                errors: {
                    message: 'El producto ya no existe o ID errónea.'
                }
            });
        }

        if (body.trash) {
            // Enviar a la papelera: status = false
            changeProductStatus(product, false, res)
        } else if (body.recovery) {
            // Recuperar de la papelera: status = true
            changeProductStatus(product, true, res)
        } else {
            // Eliminar definitivamente.
            product.delete((err, productDel) => {

                if (err) {
                    return res.status(400).json({
                        ok: false,
                        errors: err
                    });
                }

                borrarArchivo(productDel.img, 'products');

                return res.status(200).json({
                    ok: true,
                    product: productDel
                });
            });
        }

    });



});

const uploadImgProduct = (req, res, product) => {
    let img = req.files.img;
    let nameCut = img.name.split('.');
    let extension = nameCut[nameCut.length - 1];
    let extensionsValid = ['png', 'jpg', 'gif', 'jpeg'];

    if (extensionsValid.indexOf(extension) < 0) {
        return res.status(400).json({
            ok: false,
            errors: {
                message: `Las extensiones válidas para la imagen son: ${extensionsValid.join(', ')}`,
                extension: extension + ' No permitida.'
            }
        });
    }

    const finalNameImg = `${req.user._id}-${new Date().getMilliseconds()}.${extension}`;

    img.mv(`src/uploads/products/${finalNameImg}`, (err) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                errors: err
            });
        }
    });

    if (product) borrarArchivo(product.img, 'products');

    return finalNameImg;
}

const finalPriceCalculate = (price, discount = 0) => {
    return Number(price) - Number(discount);
};

const changeProductStatus = (product, status, res) => {
    product.status = status;
    product.save((err, productSaved) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                errors: err
            });
        }

        return res.status(200).json({
            ok: true,
            product: productSaved
        });

    });
}

const borrarArchivo = (nameImg, type) => {
    let pathImg = path.resolve(__dirname, `../../src/uploads/${type}/${nameImg}`);
    if (fs.existsSync(pathImg)) {
        fs.unlinkSync(pathImg);
    }
}

module.exports = app;