import express from "express";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import chatController from "../controllers/chat.controller";
import validate from "../middleware/validate.middleware";
import chatSchema from "../schema/chat.schema";
import upload from "../middleware/multer.middleware";
import validateFiles from "../middleware/validateFiles.middleware";

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
  upload.fields([{ name: "media" }]),
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

export default chatRouter;
