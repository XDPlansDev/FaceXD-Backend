// 📄 Caminho: /models/Post.js

const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    // Autor do post (referência ao usuário)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Conteúdo do post (mensagem)
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // Lista de curtidas (IDs dos usuários que curtiram)
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Lista de comentários (IDs ou subdocumentos futuramente)
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment", // você pode criar esse modelo depois
      },
    ],
  },
  {
    timestamps: true, // Gera automaticamente os campos createdAt e updatedAt
  }
);

module.exports = mongoose.model("Post", PostSchema);
