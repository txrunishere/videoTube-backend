import asyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js"
import { checkFields } from "../utils/checkFields.js"
import logger from "../utils/logging.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"


// Generate Both access and refresh token
async function generateAccessAndRefreshToken (userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Token not generated!!");
  }
};


// Register User
const registerUser = asyncHandler(
  async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new ApiError(400, "Data is required!!");
    }
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

    try {
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
    } catch (error) {
      console.log("Error while create user: ", error);
      if (avatar) {
        await deleteFromCloudinary(avatar.public_id)
      }
      if (coverImageFilePath) {
        await deleteFromCloudinary(coverImage.public_id)
      }
      throw new ApiError(500, error.message || "Error while Register User")
    }
  }
);


// Login User
const loginUser = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Data is required!!");
  }

  const { username, email, password } = req.body;
  checkFields(username, email, password);

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User not Exists!!");
  }

  const checkPassword = await user.isPasswordCorrect(password);
  if (!checkPassword) {
    throw new ApiError(400, "Incorrect Password!!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const returnUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (returnUser) {
    logger.info(
      `User ${
        username || email
      } login successfully and Token generate successfully!!`
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
      })
      .json(
        new ApiResponse(
          200,
          {
            returnUser,
          },
          `User ${username || email} successfully login`
        )
      );
  } else {
    throw new ApiError(400, "Something went wrong while Login User!!");
  }
});


// Logout User
const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "" 
      }
    },
    {
      new: true
    }
  );

  if (user) {
    logger.info(`User ${req.user.username} logout successfully!!`);
    return res
    .status(200)
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: true
    })
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure: true
    })
    .json(
      new ApiResponse(
        200,
        {},
        `User ${req.user.username} logout successfully!!`
      )
    )
  } else {
    throw new ApiError(400, "Error while logout user!!");
  }

});

export {
  registerUser,
  loginUser,
  logoutUser
}