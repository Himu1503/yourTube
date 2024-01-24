import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt  from "jsonwebtoken";
import mongoose from "mongoose";
const generateaccessAndRefreshTokens = async(userId)=>{
  try {
    const user = await User.findById(userId)
    const refreshToken = user.generateRefreshtToken()
    const accessToken = user.generateAccessToken()


    // Saving Rrefresh Token to Database
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

    return {accessToken , refreshToken}

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating token")
  }
}

//    // get user details from frontend
//     // validation - not empty
//     // check if user already exists: username, email
//     // check for images, check for avatar
//     // upload them to cloudinary, avatar
//     // create user object - create entry in db
//     // remove password and refresh token field from response
//     // check for user creation
//     // return res
    
// }

const registerUser = asyncHandler(async (req,res) => {
   // res.status(200).json({
   //    message : "ok"
   // })

  const {fullName, email,password,username} =req.body
  console.log("email: ", email )

  if(fullName === ""){
   throw new ApiError(400,"Full Name is Required")
  }
 

  if([fullName,email,password,username].some((field)=> field?.trim() === "")){
      throw new ApiError(400 , "All Fields are empty")
  }


  // Check if the User exists
  const existedUser = await User.findOne({
   $or: [{username } , {email}]
  })

  if(existedUser){
   throw new ApiError(409, "User with email or username already exists")
  }


  const avatarLocalPath = req.files?.avatar[0]?.path;

  const coverImageLocalPath= req.files?.coverImage[0]?.path;

  if(!avatarLocalPath){
   throw new ApiError(400, "Avatar File is Required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
   throw new ApiError(400, " Avatar file is required")
  }

  const user = await User.create({
   fullName,
   avatar: avatar.url,
   coverImage: coverImage?.url || "",
   email,
   password,
   username: username.toLowerCase()
  })

  const createduser= await User.findById(user._id).select(
   "-password -refreshToken"
  )

  if(!createduser){
   throw new ApiError(400, "Something went wrong while registering the User  ")
  }


  return res.status(201).json(
   new ApiResponse(200,createduser, "User Registered Successfully")
  )
})

const loginUser = asyncHandler(async () =>{
  // req, body -> data
  //username or email 
  //find the user 
  //password check
  //access and refresh token 
  //send cookie

  const {email, username, password} =req.body

  if(!(username && email)) {
    throw new ApiError(400, "username or email is required")
  }

  const user = await User.findOne({
    $or: [{username,email}] 
  })

  if(!user){
    throw new ApiError(404, "User does not eist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(400, "Invalid user credintails")
  }

  const {accessToken, refreshToken} = await generateaccessAndRefreshTokens(user._id)


  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


  //Cookies create a options

  const options = {
    httpOnly :true,
    secure: true,
  }

  return res.status(200).cookie("accessToken" , accessToken, options).cookie("refreshToken" , refreshToken, options).json( new ApiResponse(200, {
    user: loggedInUser,accessToken,refreshToken
  },
  "User Logged In Successfully"
  ))

})

const logoutUser = asyncHandler(async (req,res)=> {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{refreshToken: undefined}
    },
    {
      new:true
    }
  )

  const options = {
    httpOnly :true,
    secure: true,
  }

  return res.status(200).clearCookie("accesstoken" , options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged out successfully"))
})


const refreshAccessToken = asyncHandler(async (req,res)=>{
  const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingrefreshToken){
    throw new ApiError(401, "Unauthorized Request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401, "Invalid Refresh Token")
    }
  
    if(incomingrefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh Token is expired or used")
    }
  
    const options={
      httpOnly: true,
      secure:true
    }
  
    const {accessToken, newrefreshToken} = await generateaccessAndRefreshTokens(user._id)
  
    return res.status(200).cookie("accessToken".options).cookie("newrefreshToken", options).json(
      new ApiResponse(200 ,{
        accessToken,refreshToken : newrefreshToken
      }, "Access Token Refreshed")
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh Token")
  }


})


const changeCurrentPassword = asyncHandler(async (req,res)=>{
  const {oldPassword , newPassword} = req.body  

  const user =await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw  new ApiError(400, "Invalid old Password")
  }

  user.password = newPassword


  await user.save({
    validateBeforeSave:false
  })

  return res.status(200).json(new ApiResponse(200, {} , "Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async (req,res)=>{
  return res.status(200).json(200, req.user, "Current user fetched Successfully")
})


const constupdateAccountDetails = asyncHandler(async (req,res)=>{
  const {fullName, email} = req.body

  if(!(fullName || email)){
    throw new ApiError(400,"All fileds are required")
  }
    User.findByIdAndUpdate(
      req.user?._id,{
        $set:{
          fullName: fullName,
          email:email
        }
      },
      {
        new:true
      }
    ).select("-password")
  return res.status(200).json( new ApiResponse(200, user, "Account details update successfully"))
})



const updateUserAvatar= asyncHandler(async (req,res)=>{
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400, "Error while uploading avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { 
      $set:{
        avatar: avatar.url
      }
    },
    {new : true}
  ).select("-password")

  return res.status(200).json(
    new ApiResponse(200,user, "Avatar Updated Successfully")
  )
}) 


const updateUserCoverImage= asyncHandler(async (req,res)=>{
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover Image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400, "Error while uploading cover Image")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { 
      $set:{
        coverImage: coverImage.url
      }
    },
    {new : true}
  ).select("-password")

  return res.status(200).json(
    new ApiResponse(200,user, "Cover Image Updated Successfully")
  )

}) 


const getUserChannelProfile = asyncHandler(async (req,res) =>{
  const {username} = req.params


  if(!username?.trim()){
    throw new ApiError(400, "Usernmae is missing")
  }

  const channel = await User.aggregate([{
    $match:{
      username:username?.toLowerCase()
    }
  },{
    $lookup:{
      from:"subscriptions",
      localField: "_id",
      foreignField:"channel",
      as:"subscribers"

    }
  },{
    $lookup:{
      from:"subscriptions",
      localField: "_id",
      foreignField:"subscriber",
      as:"subscribedTo"
    }
  },{
    $addFields:{
      subscribersCount:{
        $size:"$subscribers"
      },
      channelSubscribedToCount:{
        $size:"$subscribedTo"
      },
      isSubscribed:{
        $cond:{
          if:{$in: [req.user?._id,"$subscribers.subscriber"]},
          then: true,
          else:false
        }
      }
    }
  },{
    $project:{
      fullName: 1,
      username:1,
      subscribersCount:1,
      channelSubscribedToCount:1,
      avatar:1,
      coverImage:1,
      email:1
    }
  }

]) // returns a array


if(!channel?.length){
  throw new ApiError(400, "Channel does not exist")
}


return res.status(200).json(
  new ApiResponse(200, channel[0],"User channel fetched successfully")
)
})



const getWatchHistory = asyncHandler( async (req, res)=> {
  
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistroy",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1,
                  }
                }
              ]
            }
          },{
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    },
  ])

  return res.status(200).json(
    new ApiResponse(200, user[0].watchHistory)
  )

})



export {registerUser, loginUser,logoutUser, refreshAccessToken, changeCurrentPassword,getCurrentUser,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getWatchHistory}