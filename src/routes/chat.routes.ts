import express from "express";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import chatController from "../controllers/chat.controller";
import validate from "../middleware/validate.middleware";
import chatSchema from "../schema/chat.schema";
import upload from "../middleware/multer.middleware";
import validateFiles from "../middleware/validateFiles.middleware";
import uploadS3 from "../middleware/multerS3.middleware";

const chatRouter = express.Router();

chatRouter.get("/", authenticationMiddleware, chatController.getMatches);

chatRouter.get(
  "/search",
  authenticationMiddleware,
  validate(chatSchema.searchUserSchema),
  chatController.searchUsers
);
chatRouter.put(
  "/blockUnblockUser",
  authenticationMiddleware,
  validate(chatSchema.blockUnblockUserSchema),
  chatController.blockUnblockUser
);

chatRouter.get(
  "/messages/:chatId",
  authenticationMiddleware,
  validate(chatSchema.getChatMessagesSchema),
  chatController.getChatMessages
);

chatRouter.get(
  "/getBlockedUsers",
  authenticationMiddleware,
  chatController.getBlockedUsers
);

chatRouter.post(
  "/uploadMedia",
  authenticationMiddleware,
  uploadS3.fields([{ name: "media" }]),
  validateFiles(["media"]),
  validate(chatSchema.uploadMediaSchema),
  chatController.uploadMedia
);

chatRouter.post(
  "/reportUser",
  authenticationMiddleware,
  validate(chatSchema.reportUserSchema),
  chatController.reportUser
);

chatRouter.get(
  "/generateAgoraToken",
  authenticationMiddleware,
  validate(chatSchema.generateAgoraTokenSchema),
  chatController.generateAgoraToken
);

export default chatRouter;
