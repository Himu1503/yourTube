import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"; // Adjust the path based on your project structure

const publishAVideo = asyncHandler(async (req, res) => {
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





const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
  //TODO: get all videos based on query, sort, pagination

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: {},
  };

  // Sorting
  if (sortBy) {
    options.sort[sortBy] = sortType === 'desc' ? -1 : 1;
  } else {
    // Default sorting if not specified
    options.sort.createdAt = -1;
  }

  // Filtering by user ID
  const queryFilter = userId ? { owner: userId } : {};

  // Apply other filters based on your requirements (e.g., title, description)
  if (query) {
    // You may adjust the fields based on your model
    queryFilter.$or = [
      { title: { $regex: new RegExp(query, 'i') } },
      { description: { $regex: new RegExp(query, 'i') } },
    ];
  }

  try {
    const videos = await Video.paginate(queryFilter, options);

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
  } catch (error) {
    console.error('Error fetching videos:', error.message);
    throw new ApiError(500, 'Internal Server Error');
  }
});



const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: get video by id

  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }


    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
  } catch (error) {
    console.error('Error fetching video by ID:', error.message);
    if (error.kind === 'ObjectId') {
      throw new ApiError(400, 'Invalid video ID');
    }
    throw new ApiError(500, 'Internal Server Error');
  }
});


const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: update video details like title, description, thumbnail

  const { title, description, thumbnail } = req.body;

  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    // Update video details
    video.title = title || video.title;
    video.description = description || video.description;
    video.thumbnail = thumbnail || video.thumbnail;

    // Save the updated video
    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
  } catch (error) {
    console.error('Error updating video:', error.message);
    if (error.kind === 'ObjectId') {
      throw new ApiError(400, 'Invalid video ID');
    }
    throw new ApiError(500, 'Internal Server Error');
  }
});



const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: delete video

  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    // Delete the video
    await video.remove();

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
  } catch (error) {
    console.error('Error deleting video:', error.message);
    if (error.kind === 'ObjectId') {
      throw new ApiError(400, 'Invalid video ID');
    }
    throw new ApiError(500, 'Internal Server Error');
  }
});



const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params
})

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}