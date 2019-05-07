const router = require("express").Router();
const Usuario = require("../models/User");
const { verificaToken, verificaAdmin_Role } = require('../middlewares/auth');

/**
 * Obtiene la lista completa de usuarios.
 * Por defecto pagina de 5 en 5.
 * Se piden con URL query así, ejemplo: ?from=0&limit=5
 */
router.get("/users", [verificaToken, verificaAdmin_Role], (req, res) => {
    let from = req.query.from || 0;
    from = Number(from);

    let limit = req.query.limit || 5;
    limit = Number(limit);

    Usuario.find({}, 'name email role status verify')
        .skip(from)
        .limit(limit)
        .exec((err, users) => {
            if (err) {
                return res.status(400).json({ ok: false, errors: err });
            }

            Usuario.countDocuments({ status: true }, (err, count) => {
                if (err) {
                    return res.status(400).json({ ok: false, errors: err });
                }
                return res.json({ ok: true, users, count });
            });
        });
});

/**
 * Obtiene un objeto o documento usuario mediante el ID de este.
 */
router.get('/users/:id', verificaToken, async(req, res) => {
    Usuario.findById(req.params.id, (err, user) => {
        if (err || !user) {
            return res.status(400).json({ ok: false, message: 'Usuario no existe.', errors: err });
        }
        return res.status(200).json({ ok: true, user });
    });
});

/**
 * Crea un documento Usuario y lo registra en la Base de datos.
 * - Los parámetros obligatorios son: name, email, password, password2.
 * - El email debe ser único y no estar registrado.
 * - Parametros: password y password2 tienen que coincidir para proceder al registro.
 */
router.post('/users', [verificaToken, verificaAdmin_Role], async(req, res) => {
    const { name, email, password, password2 } = req.body;

    if (!name || !email || !password || !password2) {
        return res.status(401).json({
            ok: false,
            errors: { message: 'Nombre, email y password son obligatorios.' }
        });
    }

    if (password !== password2) {
        return res.status(401).json({
            ok: false,
            errors: { message: 'Las contraseñas no coinciden.' }
        });
    }

    let user = new Usuario({ name, email });
    user.password = await user.encryptPassword(password);
    user.token_verify = await user.genTokenVerifica();

    user.save((err, userDB) => {
        if (err) { return res.status(400).json({ ok: false, errors: err }) }
        return res.json({ ok: true, usuario: userDB });
    });
});

/**
 * Edita un objeto o documento del tipo Usuario mediante su ID
 * Los parámetros a enviar opcionales son:
 *  - password (si envía password, debe enviar password2 obligatoriamente).
 *  - role, si no envía ningún parámetro role, se mantiene el que tiene asignado.
 */
router.put('/users/:id', [verificaToken, verificaAdmin_Role], (req, res) => {
    let { name, email, password, password2, role } = req.body;

    Usuario.findById(req.params.id, (err, userDB) => {
        if (err || !userDB) {
            return res.status(500).json({
                ok: false,
                message: "Error al buscar el usuario.",
                errors: err
            });
        }

        userDB.name = name;
        userDB.email = email;

        if (userDB.email !== email) {
            userDB.verify = false;
        }

        if (role) { userDB.role = role; }

        if (password) {
            if (password == password2) {
                userDB.password = password;
            } else {
                return res.status(400).json({
                    ok: false,
                    errors: 'Las contraseñas deben coincidir.'
                });
            }
        }

        userDB.save((err, userSaved) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    message: "Error al actualizar el usuario",
                    errors: err
                });
            }

            return res.status(201).json({
                ok: true,
                user: userSaved
            });
        });
    });
});

/**
 * Habilita o deshabilita un objeto o documento usuario.
 * - Para deshablitar sólo enviar verbo DELETE y el ID del documento.
 * - Para habilitar enviar DELETE, ID del documento y el parámetro status (true)
 */
router.delete('/users/:id', (req, res) => {

    let { status } = req.body;

    status = (status) ? false : true;

    Usuario.findByIdAndUpdate(req.params.id, { status }, { new: true }, (err, userDisabled) => {
        if (err || !userDisabled) {
            return res.status(400).json({
                ok: false,
                message: 'Error al buscar al usuario',
                errors: err
            });
        }

        mensaje = (status) ? 'El usuario fue habilitado' : 'El usuario fue deshabilitado';

        return res.status(201).json({
            ok: true,
            message: mensaje,
            user: userDisabled
        });
    });
});

/**
 * TODO: Recurso para verificar cuenta del usuario desde el correo.
 */
router.get('/users/:id/:verifyToken', (req, res) => {
    let id = req.params.id;
    let tokenVerify = req.params.verifyToken;

    Usuario.findById(id, (err, userVerifying) => {
        if (err || !userVerifying) {
            return res.status(400).json({
                ok: false,
                message: 'Ocurrió un error, intente nuevamente.',
                errors: err
            });
        }

        if (userVerifying.token_verify === tokenVerify) {
            userVerifying.verify = true;
            userVerifying.save((err, userVerified) => {
                if (err || !userVerified) {
                    return res.status(400).json({
                        ok: false,
                        message: 'Ocurrió un error al verificar el usuario, intente nuevamente.',
                        errors: err
                    });
                }

                return res.status(201).json({
                    ok: true,
                    message: 'Usuario verificado.',
                    user: userVerified
                });
            });
        } else {
            return res.status(400).json({
                ok: false,
                message: 'Los datos no coinciden. Verique e intente nuevamente.'
            });
        }

    })

});

module.exports = router;