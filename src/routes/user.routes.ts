import express from "express";
import userController from "../controllers/user.controller";
import validate from "../middleware/validate.middleware";
import userSchema from "../schema/user.schema";
import upload from "../middleware/multer.middleware";
import validateFiles from "../middleware/validateFiles.middleware";
import { authenticationMiddleware } from "../middleware/auth.middleware";

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
userRouter.post("/logout", userController.logout);

userRouter.post(
  "/socialLogin",
  validate(userSchema.socialLoginSchema),
  userController.socialLogin
);

userRouter.put(
  "/updateUser",
  authenticationMiddleware,
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  validateFiles(["profileImage"]),
  validate(userSchema.updateUserSchema),
  userController.updateUser
);
userRouter.put(
  "/changeCredentials",
  authenticationMiddleware,
  validate(userSchema.changeCredentialsSchema),
  userController.changeCredentials
);
userRouter.put(
  "/resetPassword",
  authenticationMiddleware,
  validate(userSchema.resetPasswordSchema),
  userController.resetPassword
);

userRouter.get("/", authenticationMiddleware, userController.getUser);
userRouter.get(
  "/searchCareTaker",
  validate(userSchema.searchCareTakerSchema),
  userController.searchCareTaker
);
userRouter.delete("/", authenticationMiddleware, userController.removeAccount);

export default userRouter;
