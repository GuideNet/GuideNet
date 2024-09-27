const mongoose = require("mongoose")

const MentorSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    expertise: {
      type: String,
      required: true,
    },
    experience: {
      type: Number,
      required: true,
    },
    company: {
      type: String,
    },
    availability: {
      type: String,
    },
    hourlyRate: {
      type: Number,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Mentor", MentorSchema)
