import { ApiError } from "./ApiError.js";

function checkFields(...args) {
  if (
    [...args].some((f) => String(f)?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required!!")
  }
}

export {
  checkFields
}