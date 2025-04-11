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

    // ✅ Data da última alteração de username (padrão: data de criação)
    usernameChangedAt: {
      type: Date,
      default: function () {
        return this.createdAt;
      },
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

    // ✅ Sexo do usuário
    sexo: {
      type: String,
      enum: ["Masculino", "Feminino"],
      required: true,
    },

    // ✅ Data de nascimento
    dataNascimento: {
      type: Date,
      required: true,
    },

    // ✅ Sistema de seguidores
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

    // ✅ Sistema de favoritos
    favoritos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
