import dotenv from "dotenv"
dotenv.config();
import { app } from "./app.js"
import { connectDB } from "./config/index.db.js"
import logger from "./utils/logging.js";

const PORT = process.env.PORT || 8080

connectDB()
.then(() => {
  app.listen(PORT, () => {
    console.log(`App is listing on PORT: ${PORT}`);
  })
})
.catch((e) => {
  logger.error(`MongoDB error while listing on PORT ${process.env.PORT}, ${e.message}`);
})