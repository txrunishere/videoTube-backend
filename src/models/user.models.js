import { Schema, model } from "mongoose"

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: [true, "Enter a unique username "],
      required: [true, "username must be required!!"],
      minLength: [3, "username must contains atleast 3 letters"],
      trim: true,
      lowercase: true,
      index: true
    },
    fullName: {
      type: String,
      required: [true, "username must be required!!"],
      minLength: [3, "username must contains atleast 3 letters"],
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minLength: [8, "Password must contains atleast 8 letters"]
    },
    avatar: {
      type: String, // Cloudinary url
      required: true
    },
    coverImage: {
      type: String
    },
    refreshToken: {
      type: String
    },
    role: {
      type: String,
      required: [true, "Enter a Role"],
      enum: ["User", "Admin", "Creator"]
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video"
      }
    ]
  },
  {timestamps: true}
);

const User = model("User", userSchema);

export { User }