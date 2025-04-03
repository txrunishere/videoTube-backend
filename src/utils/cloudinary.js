import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import logger from "./logging.js"

cloudinary.config(
  {
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  }
)

async function uploadOnCloudinary(localFile, folder=process.env.DEFAULT_CLOUDINARY_FOLDER) {
  try {
    const responseFileOnCloudinary = await cloudinary.uploader.upload(
      localFile,
      {
        resource_type: "auto",
        folder: folder
      }
    );

    logger.info("File Uploaded successfully on cloudinary " + responseFileOnCloudinary.url);
    fs.unlinkSync(localFile)
    return responseFileOnCloudinary;
  } catch (error) {
    fs.unlinkSync(localFile);
    logger.error("File Not Uploaded Successfully!!")
    return null;
  }
}

async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId)
    logger.info("Image deleted from Cloudinary. Public ID: ", publicId);
  } catch (error) {
    console.log("Error while deleting from cloudinary", error);
    return null;
  }
}

export { uploadOnCloudinary, deleteFromCloudinary }