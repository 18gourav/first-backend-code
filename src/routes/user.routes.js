import {Router} from 'express';
import { userlogin,
         loginUser,
         logoutUser,
         refreshAccessToken, 
         passwordChange,
         getUser,
         findAndUpdateDetails,
         UpdateAvatar,
         UpdateCoverImage,
         getUserChannel,
         getWatchHistory } from '../controllers/user.controller.js';

import {upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/authorization.middleware.js';

const router = Router();

router
.route("/register")
.post(
    // multer middleware to handle file uploads
    // 'avatar' and 'coverImage' are the field names in the form
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    userlogin)

    router.route("/login").post(loginUser)

    //secure route for logout
    router
    .route("/logout")
    .post(verifyJWT, logoutUser)

    router
    .route("/refresh-token")
    .post(refreshAccessToken)

    router
    .route("/change-password")
    .post(verifyJWT,passwordChange)

    router
    .route("/user-profile")
    .post(verifyJWT, getUser)

    router
    .route("/update-profile")
    .patch(verifyJWT,findAndUpdateDetails)

    router
    .route("/update-user-avatar")
    .patch(verifyJWT,upload.single("avatar"),UpdateAvatar)

    router
    .route("/update-user-coverImage")
    .patch(verifyJWT,upload.single("coverImage"),UpdateCoverImage)

    router
    .route("/c/:username")
    .get(verifyJWT,getUserChannel)

    router
    .route("/user-watch-history")
    .get(verifyJWT,getWatchHistory)

export default router;