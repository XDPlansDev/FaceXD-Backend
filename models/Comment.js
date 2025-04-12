const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 1000, // Limite de caracteres para comentários
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  // Respostas a comentários (para futura implementação de threads)
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
  }],
  // Comentário pai (para identificar respostas)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  // Status do comentário (para moderação)
  status: {
    type: String,
    enum: ["active", "hidden", "deleted"],
    default: "active",
  },
}, {
  timestamps: true, // createdAt e updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para melhorar a performance das consultas
CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1 });

module.exports = mongoose.model("Comment", CommentSchema);
