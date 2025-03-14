import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserDetails,
  changeCurrentPassword,
  refreshAccessToken,
  updateUserAvatar
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken)

router.route("/update-user").patch(verifyJWT, updateUserDetails);
router.route("/change-password").patch(verifyJWT, changeCurrentPassword)
router.route("/update-avatar").patch(
  verifyJWT,
  upload.single('avatar'),
  updateUserAvatar
)

router.route("/get-user").get(verifyJWT, getCurrentUser);

export default router;
