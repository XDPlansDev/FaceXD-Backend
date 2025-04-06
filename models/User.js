// models/User.js
// Atualização do model User para suportar o campo "username" definido pelo usuário.
// Alterações:
// 1. O campo "username" já está definido como required e unique.
// 2. Removido o pre-save hook que atribuía automaticamente o email ao username,
//    permitindo que o username seja definido no momento do registro.

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    sobrenome: {
      type: String,
      required: true,
      trim: true,
    },
    telefone: {
      type: String,
      required: false, // Opcional
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    cep: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true } // Cria campos createdAt e updatedAt automaticamente
);

// Removido o pre-save hook que definia username como email
// Isso permite que o campo "username" seja definido diretamente pelo usuário durante o registro
// UserSchema.pre("save", function (next) {
//   this.username = this.email;
//   next();
// });

module.exports = mongoose.model("User", UserSchema);