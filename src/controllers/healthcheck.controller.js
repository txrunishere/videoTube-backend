import asyncHandler from "express-async-handler";
import { ApiResponse } from "../utils/ApiResponse.js"

const healthcheck = asyncHandler(async (req, res) => {
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "OK Report"
    )
  )
})

export {
  healthcheck
}