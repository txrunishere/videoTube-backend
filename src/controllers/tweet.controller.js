import asyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Tweet } from "../models/tweet.model.js"
import { checkFields } from "../utils/checkFields.js"
import logger from "../utils/logging.js"


const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Enter a Tweet")
  }

  if (content.length < 3) {
    throw new ApiError(400, "Please enter atleast 3 words in your Tweet")
  }

  const tweet = await Tweet.create(
    {
      content: content,
      owner: req.user
    }
  )

  if (tweet) {
    return res.status(201).json(
      new ApiResponse(201, tweet, "Tweet Created")
    )
  } else {
    throw new ApiError(500, "Error white create User's Tweet")
  }
})







export {
  createTweet
}