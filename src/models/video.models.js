import { Schema, model } from "mongoose"

const videoSchema = new Schema(
  {
    videoFile: {
      type: String,
      required: [true, "Video File is required!!"],
    },
    thumbnail: {
      type: String,
      required: [true, "Video Thumbnail is required!!"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    title: {
      type: String,
      required: true,
      minLength: [3, "Title must contain atleast 3 letters"],
      maxLength: [50, "Only 50 words are required!!"]
    },
    description: {
      type: String,
      required: true,
      minLength: [3, "Description must contain atleast 3 letters"],
      maxLength: [700, "Only 700 words are required!!"]
    },
    duration: {
      type: Number,
      required: true
    },
    views: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

const Video = model("Video", videoSchema);
export { Video }