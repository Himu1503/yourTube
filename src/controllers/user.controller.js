import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


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

export {registerUser}