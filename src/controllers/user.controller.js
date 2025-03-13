import asyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js"
import { checkFields } from "../utils/checkFields.js"
import logger from "../utils/logging.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import fs from "fs"


const registerUser = asyncHandler(
  async (req, res) => {
    const { username, fullName, email, password, role } = req.body;
    checkFields(username, fullName, email, password, role);

    if(!email?.endsWith('@gmail.com')) {
      throw new ApiError(400, "Enter a Valid Email Address!!");
    }

    const isUserExists = await User.findOne(
      {
        $or: [{ username }, { email }]
      }
    );
    if (isUserExists) {
      throw new ApiError(409, "User already Exists");
    }

    logger.info(`New Register request - ${username}`);

    const avatarFilePath = req.files?.avatar?.[0]?.path;
    const coverImageFilePath = req.files?.coverImage?.[0]?.path;
    if (!avatarFilePath) {
      throw new ApiError(400, "Avatar Image Required!!");
    }

    let avatar;
    let coverImage;

    try {
      avatar = await uploadOnCloudinary(avatarFilePath);
    } catch (error) {
      logger.error("Avatar File not Uploaded", error);
      throw new ApiError(500, "Avatar file not uploaded")
    }

    if (coverImageFilePath) {
      try {
        coverImage = await uploadOnCloudinary(coverImageFilePath)
      } catch (error) {
        logger.error("CoverImage not uploaded", error)
        throw new ApiError(500, "Cover Image not uploaded")
      }
    }

    const user = await User.create(
      {
        username,
        fullName,
        email,
        password,
        role,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
      }
    )

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (createdUser) {
      logger.info(`User ${username} register successfully`)
      return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          {
            createdUser
          },
          `User ${username} register successfully`
        )
      )
    } else {
      throw new ApiError(400, "Something went wrong while create user!!")
    }
  }
)

export {
  registerUser
}