import express from "express"
import logger from "./utils/logging.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static('public'))
app.use(cookieParser());

const morganFormat = ":method :url :status :response-time ms";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

// Imports 
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"


// Routes
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/user", userRouter)
app.use("/api/v1/tweet", tweetRouter)


export { app }