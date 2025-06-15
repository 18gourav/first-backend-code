import {Router} from 'express';
import { userlogin, loginUser, logoutUser } from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/authorization.middleware.js';

const router = Router();

router.route("/register").post(
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
    router.route("/logout").post(verifyJWT, logoutUser)

export default router;