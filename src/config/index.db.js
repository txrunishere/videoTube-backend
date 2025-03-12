import mongoose from "mongoose"
import logger from "../utils/logging.js";


const connectDB = async () => {
  try {
    const connectionMongoDB = await mongoose.connect(process.env.MONGODB_URI);
    console.log(
      "DataBase Connection Success...",
      connectionMongoDB.connection.name,
      connectionMongoDB.connection.host
    );
  } catch (error) {
    logger.error("Database Connection failed!!");
    process.exit(1);
  }
}

export { connectDB }