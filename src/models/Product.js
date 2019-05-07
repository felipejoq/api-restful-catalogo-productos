const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

let Schema = mongoose.Schema;

let productoSchema = new Schema({
    img: {
        type: String,
        required: [true, "Debe agregar una imagen"]
    },
    name: {
        type: String,
        required: [true, "El nombre es necesario"]
    },
    quanty: {
        type: Number,
        required: [true, "Ingrese una cantidad"]
    },
    description: {
        type: String,
        required: [true, "La descripción es obligatoria"]
    },
    price: {
        type: Number,
        required: [true, "El precio es obligatorio"]
    },
    final_price: {
        type: Number,
        required: false
    },
    discount: {
        type: Number,
        default: 0,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
});

productoSchema.plugin(uniqueValidator, { message: "{PATH} debe de ser único" });

module.exports = mongoose.model("Producto", productoSchema);