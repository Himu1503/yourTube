import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Give me a Tweet") 
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user_id,
    })


  return res.status(201).json(
    new ApiResponse(200,tweet, "User Registered Successfully")
   )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const {content} = req.body

    if(!(content)){
        throw new ApiError(400,"Content is required")
      }

      Tweet.findByIdAndUpdate(
        req.user?._id,{
          $set:{
            content: content,
          }
        },
        {
          new:true
        }
      )
    return res.status(200).json( new ApiResponse(200, user, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params 

    try {
        const tweet = await Tweet.findById(tweetId)

        if(!tweet){
            throw new ApiError(404, "Tweet not found");
        }

        await tweet.remove()
        return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"));

    } catch (error) {
        console.error('Error deleting video:', error.message);
        if (error.kind === 'ObjectId') {
          throw new ApiError(400, 'Invalid tweet ID');
        }
        throw new ApiError(500, 'Internal Server Error');
      }

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}