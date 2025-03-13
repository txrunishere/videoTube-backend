import { Schema, model } from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

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

userSchema.pre('save', async function( next ) {
  if (!this.isModified("password")) { return next() };
  this.password = await bcrypt.hash(this.password, 12);
  next()
});

userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

const User = model("User", userSchema);

export { User }