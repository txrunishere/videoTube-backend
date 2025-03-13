import { v2 as cloudinary, v2 } from "cloudinary";
import fs from "fs"
import logger from "./logging.js"

cloudinary.config(
  {
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  }
)

const uploadOnCloudinary = async function(localStorage) {
  try {
    const responseFileOnCloudinary = await cloudinary.uploader.upload(localStorage, { resource_type: "auto" });
    logger.info("File Uploaded successfully on cloudinary" + responseFileOnCloudinary.url);
    fs.unlinkSync(localStorage)
    return responseFileOnCloudinary;
  } catch (error) {
    fs.unlinkSync(localStorage);
    logger.error("File Not Uploaded Successfully!!")
    return null;
  }
}

export { uploadOnCloudinary }