import express from "express";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import matchesController from "../controllers/chat.controller";
import validate from "../middleware/validate.middleware";
import chatSchema from "../schema/chat.schema";
import upload from "../middleware/multer.middleware";
import validateFiles from "../middleware/validateFiles.middleware";

const chatRouter = express.Router();

chatRouter.get("/", authenticationMiddleware, matchesController.getMatches);
chatRouter.get(
  "/search",
  authenticationMiddleware,
  validate(chatSchema.searchUserSchema),
  matchesController.searchUsers
);
chatRouter.put(
  "/blockUnblockUser",
  authenticationMiddleware,
  validate(chatSchema.blockUnblockUserSchema),
  matchesController.blockUnblockUser
);

chatRouter.get(
  "/messages/:chatId",
  authenticationMiddleware,
  validate(chatSchema.getChatMessagesSchema),
  matchesController.getChatMessages
);

chatRouter.get(
  "/getBlockedUsers",
  authenticationMiddleware,
  matchesController.getBlockedUsers
);

chatRouter.post(
  "/uploadMedia",
  authenticationMiddleware,
  upload.fields([{ name: "media" }]),
  validateFiles(["media"]),
  validate(chatSchema.uploadMediaSchema),
  matchesController.uploadMedia
);

export default chatRouter;
