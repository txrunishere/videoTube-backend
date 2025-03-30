import asyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js"
import { checkFields } from "../utils/checkFields.js"
import logger from "../utils/logging.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

/*
  Pending Routes
  -> refreshAccessToken [ DONE ]
  -> changeCurrentPassword [ DONE ]
  -> getCurrentUser [ DONE ]
  -> updateUserDetails [ DONE ]
  -> updateUserAvatar [ DONE ]
  -> updateUserCoverImage [ DONE ]
*/

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

    if (password.length < 8) {
      throw new ApiError(400, "Password must contains atleast 8 letters");
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

  if (password.length < 8) {
    throw new ApiError(400, "Password must contains atleast 8 letters");
  }

  if (email) {
    if (!email.endsWith('@gmail.com')) {
      throw new ApiError(400, "Enter a valid email")
    }
  }

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


// Get Information of current user
const getCurrentUser = asyncHandler(
  async (req, res) => {
    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        req.user,
        `Information of ${req.user.username}`
      )
    )
  }
)


// Update Username
/**
 * -> first check one of the field is available betweeen email, username, fullName
 * -> check for email is in proper way 
 * -> check that the fields want to update and replace data is not same
 * -> create empty object for store which fiels comes for update
 * -> save on the specific fiels
 * -> return updated user
*/
const updateUserDetails = asyncHandler(
  async (req, res) => {
    const { fullName, username, email } = req.body;

    if (!(email || username || fullName)) {
      throw new ApiError(400, "One of the field is required!!");
    }

    if (email) {
      if (!email.endsWith('@gmail.com')) {
        throw new ApiError(400, "Enter a valid email address!!")
      }
    }

    if ( email === req.user.email || fullName === req.user.fullName || username === req.user.username ) {
      throw new ApiError(400, "Enter a different field");
    }

    let updateFields = {};
    if (email) updateFields.email = email;
    if (fullName) updateFields.fullName = fullName;
    if (username) updateFields.username = username;

    console.log(updateFields);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: updateFields
      },
      {
        new: true,
      }
    ).select(
      "-password -refreshToken"
    )

    if(user) {
      logger.info(`Field is updated successfully!!`)
      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user,
          "User's detail updated successfully!!"
        )
      )
    } else {
      throw new ApiError(400, "Error while update user's details")
    }

  }
)


// Update User's password
/**
 * -> get new and old password from the user
 * -> check password is correct or not
 * -> replace new password from old password
 * -> return response to user
*/
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword && !newPassword) {
    throw new ApiError(400, "Enter both new and old password!!");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "Password must contains atleast 8 letters");
  }

  const user = await User.findById(req.user._id);

  const checkPassword = await user.isPasswordCorrect(oldPassword);
  if (!checkPassword) throw new ApiError(200, "Invalid Password!!");

  user.password = newPassword;
  user.save({
    validateBeforeSave: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `User ${user.username} password updated successfully!!`
      )
    );
});


// Change Refresh Token
/**
 * -> get refresh token from req.cookies
 * -> decode that refresh token
 * -> find user with decoded token's id
 * -> match user's refresh token (which we store in DB) with incomming refresh token from user
 * -> generate both new access and refresh token
 * -> return both tokens to user
*/
const refreshAccessToken = asyncHandler(
  async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Refresh Token not Found!!");
    }

    try {
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  
      const user = await User.findById(decodedToken?._id).select("-password");
      if (!user) {
        throw new ApiError(400, "User not Found!!")
      }
  
      if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is used or expired!!")
      }
  
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

      return res
      .status(200)
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true
      })
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "New Access and refresh tokens are generated!!"
        )
      )
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid Token")
    }
  }
);


// Update User's avatar
/**
 * -> set single image to upload
 * -> get filepath of avatar image
 * -> check for file path
 * -> TODO: delete old image from cloudinary - { DONE }
 * -> upload new avatar on cloudinary
 * -> set user's avatar with new avatar
 * -> return user with new user response
*/
const updateUserAvatar = asyncHandler(
  async (req, res) => {
    const avatarFilePath = req.file?.path;
    if (!avatarFilePath) {
      throw new ApiError(400, "Avatar file not found!!")
    }

    // Delete old avatar from Cloudinary
    const oldAvatar = req.user?.avatar;
    if (oldAvatar) {
      const publicId = oldAvatar.split("/").pop().split(".")[0];
      try {
        await deleteFromCloudinary(publicId);
      } catch (error) {
        logger.error("Old avatar file not deleted", error);
        throw new ApiError(500, "Old avatar file not deleted");
      }
    }

    let avatar;
    try {
      avatar = await uploadOnCloudinary(avatarFilePath)
    } catch (error) {
      logger.error("Avatar File not Uploaded", error);
      throw new ApiError(500, "Avatar file not uploaded")
    }
    if (!avatar.url) {
      throw new ApiError(500, "Image not generate url from server side");
    }

    try {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            avatar: avatar?.url
          }
        },
        { new: true }
      ).select("-password -refreshToken")
  
      if (user) {
        return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { user },
            `User ${user.username} avatar image successfully updated and uploaded on cloudinary!!`
          )
        )
      } else {
        throw new ApiError(400, "Error while update user's avatar image")
      }
    } catch (error) {
      await deleteFromCloudinary(avatar.public_id);
      throw new ApiError(500, "Something wrong while upload image to cloudinary");
    }
  }
);


// Update coverImage
const updateUserCoverImage = asyncHandler(
  async (req, res) => {
    const coverImageFilePath = req.file?.path;
    if (!coverImageFilePath) {
      throw new ApiError(400, "CoverImage file not found!!")
    }

    const oldCoverImage = req.user?.avatar;
    if (oldCoverImage) {
      const publicId = oldCoverImage.split("/").pop().split(".")[0];
      try {
        await deleteFromCloudinary(publicId);
      } catch (error) {
        logger.error("Old CoverImage file not deleted", error);
        throw new ApiError(500, "Old CoverImage file not deleted");
      }
    }

    let coverImage;
    try {
      coverImage = await uploadOnCloudinary(coverImageFilePath)
    } catch (error) {
      logger.error("coverImage File not Uploaded", error);
      throw new ApiError(500, "coverImage file not uploaded")
    }
    if (!coverImage.url) {
      throw new ApiError(500, "Image not generate url from server side");
    }

    try {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            coverImage: coverImage?.url
          }
        },
        { new: true }
      ).select("-password -refreshToken")
  
      if (user) {
        return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { user },
            `User ${user.username} coverImage image successfully updated and uploaded on cloudinary!!`
          )
        )
      } else {
        throw new ApiError(400, "Error while update user's coverImage image")
      }
    } catch (error) {
      await deleteFromCloudinary(coverImage.public_id);
      throw new ApiError(500, "Something wrong while upload image to cloudinary");
    }
  }
);

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserDetails,
  changeCurrentPassword,
  refreshAccessToken,
  updateUserAvatar,
  updateUserCoverImage,
}