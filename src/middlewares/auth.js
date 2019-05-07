const jwt = require("jsonwebtoken");

/**
 * Verificar token
 */
let verificaToken = (req, res, next) => {
    let token = req.get("token"); //En vez de token si es Authorización

    jwt.verify(token, process.env.SEED, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                errors: {
                    message: "Token no válido."
                }
            });
        } else {
            req.user = decoded.user;
            next();
        }
    });
};

/**
 * Verificar Admin_Role
 */
let verificaAdmin_Role = (req, res, next) => {
    let user = req.user;
    if (user.role === "ADMIN_ROLE") {
        next();
    } else {
        return res.json({
            ok: false,
            err: {
                message: "El usuario no es administrador"
            }
        });
    }
};

/**
 * Verificar Token en solicitud de imagenes
 */
let verificaTokenImg = (req, res, next) => {
    let token = req.query.token;

    jwt.verify(token, process.env.SEED, (err, decoded) => {
        if (err) {
            res.status(401).json({
                ok: false,
                err: {
                    message: "Token no válido."
                }
            });
        } else {
            req.user = decoded.user;
            next();
        }
    });
};

module.exports = {
    verificaToken,
    verificaAdmin_Role,
    verificaTokenImg
};