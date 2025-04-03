import express from "express";
import userController from "../controllers/user.controller";
import validate from "../middleware/validate.middleware";
import userSchema from "../schema/user.schema";
import upload from "../middleware/multer.middleware";
import validateFiles from "../middleware/validateFiles.middleware";

const userRouter = express.Router();

userRouter.post(
  "/",
  validate(userSchema.registerUserSchema),
  userController.register
);

userRouter.put(
  "/verifyOtp",
  validate(userSchema.verifyOTPSchema),
  userController.verifyOtp
);

userRouter.put(
  "/sendOtp",
  validate(userSchema.sendOTPSchema),
  userController.sendOtp
);

userRouter.put(
  "/completeRegistration",
  upload.fields([{ name: "photos", maxCount: 4 }]),
  validateFiles(["photos"]),
  validate(userSchema.completeRegistrationSchema),
  userController.completeRegistration
);

userRouter.post(
  "/login",
  validate(userSchema.loginSchema),
  userController.login
);

userRouter.post(
  "/socialLogin",
  validate(userSchema.socialLoginSchema),
  userController.socialLogin
);

userRouter.get("/", userController.getUser);

export default userRouter;
