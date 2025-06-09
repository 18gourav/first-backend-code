import asyncHandler from './../utils/asyncHandler.js';
import { apiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js' 
import {UploadFile} from '../utils/cloudinary.js';
import { apiResponse } from '../utils/apiResponse.js';

const userlogin = asyncHandler(async (req,res) => {

// this segment is to take the user input from the request body
   const { emailId, password, fullName, username } = req.body;
   console.log("email : ", emailId)


// this segment is to check if all fields are provided or not
   if(
      [emailId, password, fullName, username].some((field => field?.trim() === ''))
   ){
      throw new apiError(400, 'All fields are required');
   }

  
// this segment is to check if the user already exists or not
   const existedUser = await User.findOne({
      $or: [{emailId}, {username}]
   })

   if(existedUser) {
      throw new apiError(409, 'Username or email already exists')
   }

   
// this segment is to check if the user has uploaded avatar and cover image or not
   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage[0]?.path 

   if(!avatarLocalPath){
      throw new apiError(400, 'avatar is required')
   }


  // this segment is to check if the image is uploaded on cloudinary or not
   const avatar = await UploadFile(avatarLocalPath)
   const coverimage = await UploadFile(coverImageLocalPath)

   if(!avatar) {
      throw new apiError(500, 'Failed to upload avatar image');
   }

   // this segment is to send data to the database
   const users = await User.create({
      emailId,
      password,
      username,
      fullName,
      avatar : avatar.url,
      coverImage: coverimage?.url || '',
   })

   
   // this segment is to remove password and refresh token from the database response 
   // and also to check if user is created or not
   const createdUser = await User.findById(users._id).select(
      '-password -refreshToken'
   )

   if(!createdUser) {
      throw new apiError(500, 'Failed to create user');
   }


   // this segment is to return the response to the client
    return res.status(201).json(
      new apiResponse(201, createdUser, 'User created successfully')
    )

})



export { userlogin };