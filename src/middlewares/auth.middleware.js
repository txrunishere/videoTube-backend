import expressAsyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";

const verifyJWT = expressAsyncHandler(async (req, _, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      throw new ApiError(400, "Token not found!");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    if (!user)
      throw new ApiError(400, "User Not found!!")

    req.user = user;
    next()
  } catch (error) {
    throw new ApiError(401, error.message || "Something went wrong while check access token")
  }
});

export { verifyJWT };
