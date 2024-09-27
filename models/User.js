const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["mentee", "mentor"],
      default: "mentee",
    },
    avatar: {
      data: Buffer,
      contentType: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: String,
    verificationCodeExpires: Date,
  },
  { timestamps: true }
)

module.exports = mongoose.model("User", UserSchema)
