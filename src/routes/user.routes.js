import {Router} from 'express';
import { userlogin } from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';

const router = Router();

router.route("/login").post(
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

export default router;