import asyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Tweet } from "../models/tweet.model.js"
import mongoose, { isValidObjectId } from "mongoose";


// Create Tweet
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


// Get User's Tweets
const getUserTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "User's id is required!!")
  }

  const objectId = new mongoose.Types.ObjectId(userId)

  const tweet = await Tweet.find({
    owner: objectId
  })

  if (tweet) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          count: tweet.length,
          tweet
        },
        `Here are tweets of user ${userId}`
      )
    )
  }
});


// Update User's Tweet
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { newTweet } = req.body

  if (!mongoose.Types.ObjectId.isValid(tweetId))
    throw new ApiError(400, "Tweet not found!!")

  if (!newTweet) throw new ApiError(400, "Enter updated Tweet")

  const objectId = new mongoose.Types.ObjectId(tweetId)

  const tweet = await Tweet.findByIdAndUpdate(objectId, {
    content: newTweet
  }, { new: true })
  
  if (tweet) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {},
        `Tweet with id ${objectId} updated successfully!!`
      )
    )
  } else {
    throw new ApiError(400, "Error while Update Tweet")
  }
});


// Delete User's Tweet
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Tweet not Found")
  }

  const objectId = new mongoose.Types.ObjectId(tweetId)

  console.log(tweetId);
  console.log(objectId);

  const tweet = await Tweet.findByIdAndDelete(objectId, {
    new: true
  });

  if (tweet) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {},
        `Tweet with id ${objectId} deleted successfully`
      )
    )
  } else {
    throw new ApiError(400, "Error while Delete Tweet")
  }
});

export {
  createTweet,
  getUserTweet,
  updateTweet,
  deleteTweet
}