import { Schema, model } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // Cloudinary URL
      required: [true, "Video File is required!!"],
    },
    thumbnail: {
      type: String, // Cloudinary URL
      required: [true, "Video Thumbnail is required!!"],
    },
    owner: {
      type: Schema.Types.ObjectId, // Owner of video. Get owner from auth
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
      type: Number, // maybe response from cloudinay object
      required: true
    },
    views: {
      type: Number, // TODO:
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

videoSchema.plugin(mongooseAggregatePaginate)

const Video = model("Video", videoSchema);
export { Video }