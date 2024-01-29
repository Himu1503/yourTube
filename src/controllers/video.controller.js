import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"; // Adjust the path based on your project structure

const uploadVideo = asyncHandler(async (req, res) => {
  const { description, title } = req.body;

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!(videoFile.url && thumbnail.url)) {
    throw new ApiError(400, "Video and thumbnail are required");
  }

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Title and description are required");
  }

  // if (!duration || isNaN(duration)) {
  //   throw new ApiError(400, "Valid duration is required");
  // }

  const video = await Video.create({
    title,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    description,
    owner: req.user_id, // Assuming req.user_id is correctly populated
  });

  return res.status(200).json(new ApiResponse(200, video, "Video uploaded successfully"));
});

export { uploadVideo };
