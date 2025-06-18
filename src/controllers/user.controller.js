import asyncHandler from './../utils/asyncHandler.js';
import { apiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js' 
import {UploadFile} from '../utils/cloudinary.js';
import { apiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

//this segment is used to generate the refresh and access token for the user
const generateRefreshandAccessToken = async (userId) => {

   const user = await User.findById(userId)
   const refreshToken = user.generateRefreshToken();
   const accessToken = user.generateAccessToken();
 
   // this segment is used to save the refresh token in the user document
   user.refreshToken = refreshToken;

   //hum ye segment isliye kar rahe hain taaki hum user ki refresh token ko update kar sakein
   await user.save({ validateBeforeSave: false });

   return { refreshToken, accessToken };
}

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
   const avatarLocalPath = req.files?.avatar[0]?.path;
   //const coverImageLocalPath = req.files?.coverImage[0]?.path;
  
   //humne itna likha hai kyunki agar user ne cover image nahi upload kiya hai toh hum usko 
   // undefined nahi dena chahte
   // agar cover image nahi upload kiya hai toh hum usko empty string dena chahte hain
   let coverImageLocalPath;

   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path;
   }

   if(!avatarLocalPath){
      throw new apiError(400, 'avatar is required')
   }


  // this segment is to check if the image is uploaded on cloudinary or not
   const avatar = await UploadFile(avatarLocalPath)
   const coverImage = await UploadFile(coverImageLocalPath)

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
      coverImage: coverImage?.url || '',
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

const loginUser = asyncHandler(async (req,res) => {

   //todos
   // get the data from the req.body
   // check if the user exists or not
   // if user exists then check if the password is correct or not
   // if password exist then allot the access token
   // send cookie

   // the dif bw access and refresh token is that access token is short lived and refresh token is
   // long lived and can be used to get a new access token when the access token expires

   const { emailId, username , password} = req.body;

   if(!emailId || !username) {
      throw new apiError(400, 'abe lodu naam or email toh de de')
   }

   const findUser = await User.findOne({
        $or: [{username}, {emailId}]
    })


   if(!findUser) {
      throw new apiError(404, 'User not found')
   }

   const passwordMatch = await findUser.isPasswordCorrect(password) 

   if(!passwordMatch) {
      throw new apiError(401, 'chutad password galat hai')
   }

   const {refreshToken, accessToken} = await generateRefreshandAccessToken(findUser._id)
   
   const loggedInUser = await User.findById(findUser._id).select(
      '-password -refreshToken'
   )

   const options = {
      httpOnly: true,
      secure: true
   }

   return res
      .status(200)
      .cookie('accessToken', accessToken , options)
      .cookie('refreshToken', refreshToken, options)
      .json(
         new apiResponse(200,
            {
               findUser: loggedInUser,
               accessToken,
               refreshToken
            },
            'User logged in successfully'
         )
      )
})

const logoutUser = asyncHandler(async (req,res) => {

   //in this segment we are going to remove the refresh token from the user document
   User.findByIdAndUpdate(
      req.user._id,
      {
         $set : { refreshToken: undefined}
      },
      {
         new: true,
      }
   )

   //this segment is used taaki ham log hi cokies ko clear kar sakein
   const options = {
      httpOnly: true,
      secure: true
   }
   
   // this segment is used to clear the cookies from the browser
   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new apiResponse(200, null, 'User logged out successfully'))
   
})

const refreshAccessToken = asyncHandler(async (req, res) => {  
   const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken;

   if(!incomingrefreshToken) {
      throw new apiError(401, 'Refresh token is required');
   }

   const decodedToken = jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET);

   const user = await User.findById(decodedToken._id)

   if(!user) {
      throw new apiError(401, 'User not found');
   }

   if(incomingrefreshToken !== user?.refreshToken) {
      throw new apiError(401, 'Invalid refresh token');
   }

   const options = {
      httpOnly: true,
      secure: true
   }

   const {accessToken, refreshToken} = await generateRefreshandAccessToken(user._id)

   return res
   .status(200)
   .cookies('accessToken', accessToken, options)
   .cookies('refreshToken', refreshToken, options)
   .json(
      new apiResponse(200,
         {
            accessToken,
            refreshToken,
         },
         'Access token refreshed successfully'
      )
   )   
   


})

const passwordChange = asyncHandler(async (req,res) => {
//hamna yaha pa User.findbyidandupadte use nhi kiya kyuki hama yaha hooks bhi run karvana ha jaise pre
//vagera
   const { oldPassword, newPassword } = req.body;

   const user = await User.findById(req.user?._id)

   const passwordCorrect = user.isPasswordCorrect(oldPassword);

   if(!passwordCorrect) {
      throw new apiError(200, 'the password is not same as old')
   }

   user.password = newPassword;
   await user.save({validateBeforeSave : false});

   return res
   .status(200)
   .json(
       new apiResponse(401, 'password succesfuly changed')
   )

   
})

const getUser = asyncHandler(async (req,res) => {
   const currentUser = await User.findById(req.user?._id)
 
   return res.
   status(200)
   .json(
      200,
      {currentUser},
      'user fetched succesfully'
   )
})

const findAndUpdateDetails = asyncHandler(async (req,res) => {
   
   const {fullName, username} = req.body

   const updatedDetails = await User.findByIdAndUpdate(req.user?._id,
      {
         $set : {fullName, username}
      },
      {new : true}
   ).select("-password")

   return res 
   .status(200)
   .json(new apiResponse(
      200,updatedDetails,'details updated succesfully'
   ))


})

const UpdateAvatar = asyncHandler(async (req,res) => {
   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath) {
      throw new apiError(401, 'avatar is missing')
   }

   const updatedAvatar = await UploadFile(avatarLocalPath)

   User.findByIdAndUpdate(req.user?._id,
      {$set : 
         {
            avatar : updatedAvatar.url
         }
      },
      {new:true}
   )

   return res
   .status(200)
   .json(
      new apiResponse(200,
         {updatedAvatar},
         'avatar updated succesfully'
      )
   )
   
})

const UpdateCoverImage = asyncHandler(async (req,res) => {
   const coverImageLocalPath = req.file?.path

   if(!coverImageLocalPath) {
      throw new apiError(401, 'cover image is missing')
   }

   const updatedCoverImage = await UploadFile(coverImageLocalPath)

   User.findByIdAndUpdate(req.user?._id,
      {$set : 
         {
            avatar : updatedCoverImage.url
         }
      },
      {new:true}
   )

   return res
   .status(200)
   .json(
      new apiResponse(200,
         {updatedCoverImage},
         'cover image updated succesfully'
      )
   )
   
})

//in this segement we are going to undersatnd about mongodb pipelines and we will write controllers of 
// the user channel display where we display it like our youtube channel
const getUserChannel = asyncHandler(async (req,res) => {
   //req.params ka matlab ha ki jo url hit kara ha usma sa username nikalna
   const {username} = req.params

   if(!username) {
      throw new apiError(400, ' Username does not fetched ')
   }
  
   //aggregate meaning is to integrate pipeline
   const channel = await User.aggregate([
      //1st pipeline
      // $match ka matlab ha ki ham kis basis pa match karna chahta ha jaisa ki isma ham log
      //  username ka basis pa karna chahta ha
      {
         $match : {
            username : username?.toLowerCase()
         }
      },
      //2nd pipeline
      //lookup ka matlab ki ab ham log dusre document se information leneg
      {
         $lookup : {
               from: 'subscriptions', // from matlab kisko dekhna chahta ho
               localField: '_id',// local field matlab kaha se dekhna chahta ho jaise hum user or user ma bhi kiss field se 
               foreignField:'channel', // matlab jo subscriptions ha isma kya field dekhna chahta ho
               as:'subscribers' // ab jab sab kuch dekhlia to usko kaise display karvana ha
         }
      },
      {
          $lookup : {
               from: 'subscriptions',
               localField: '_id',
               foreignField:'subscriber',
               as:'subscribedTo'
         }
      },
      //3rd pipeline
      {
         $addFields : {              // add field matlab jo origin document ha usma field add karna jaise uaer ma
            SubscribersCount : {
                  $size : "$subscribers"  //size matlab jo hamna upar count document search kiye ha/ dekhe ha unko count karna
            },
            SubscribedToCount : {
               $size: "$subscribedTo"
            },
            isSubscribed : {
               $cond : {          // cond matlab condition 
                  $in : [req.user?._id, "$subscribers.subscriber"],
                  then : true,
                  else: false
               }
            }
         }
      },
      //4th pipeline
      {
         $project : {            // project matlab ki hama frontend pa kya kya display karvana ha un sabko 1 kardo
            fullName : 1,
            username : 1,
            SubscribersCount:1,
            SubscribedToCount:1,
            isSubscribed:1,
            coverImage:1,
            avatar:1
         }
      }
   ])

   if (!channel?.length) {
      throw new apiError(404, 'channel not exist')
   }

   return res
   .status(200)
   .json(
      new apiResponse(400, channel[0], 'user channel fetched')
   )
})

const getWatchHistory = asyncHandler(async (req,res) => {
   const History = await User.aggregate([
      {
         $match:{
            _id: new mongoose.Types>isObjectIdOrHexString(req.user?._id)
         }
      },
      {
         $lookup: {
            from:'videos',
            localField:'watchHistory',
            foreignField:'_id',
            as:'watchHistory',
            pipeline: [
               {
                  $lookup: {
                     from :'users',
                     localField:'owner',
                     foreignField:'_id',
                     as:'owner',
                     pipeline: [
                        {
                           $project:{
                              fullName: 1,
                              username: 1,
                              avatar: 1
                           }
                        }
                     ]
                  }
               },
               {
                  $addFields:{
                     owner:{
                        $first:"$owner"
                     }
                  }
               }
            ]
         }
      }
   ])

   return res
   .status(200)
   .json(new apiResponse(
      400,
      History[0].watchHistory,
      'watch history fetched succesfully'
   ))
})

export { userlogin, loginUser, logoutUser, refreshAccessToken,passwordChange, getUser ,
    findAndUpdateDetails, UpdateAvatar, UpdateCoverImage, getUserChannel, getWatchHistory};