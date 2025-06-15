import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import  {User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req , res , next) => {
    try {
        const Token = req.cookies?.accessToken 
                       || 
        req.headers('Authorization')?.replace('Bearer ', '')

    if(!Token) {
        throw new apiError(401, 'You are not authorized to access this resource');
    }

    const decodedToken =  jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET)
    
     const user = await User.findById(decodedToken._id).select('-password -refreshToken')

    if(!user) {
        throw new apiError(401, 'You are not authorized to access this resource');
    }

    req.user = user;
    next();
    } catch (error) {
        throw new apiError(401, error?.message || 'access denied, invalid token') 
    }

})