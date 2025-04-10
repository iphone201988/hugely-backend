import express from "express";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import matchesController from "../controllers/chat.controller";
import validate from "../middleware/validate.middleware";
import chatSchema from "../schema/chat.schema";

const chatRouter = express.Router();

chatRouter.get("/", authenticationMiddleware, matchesController.getMatches);
chatRouter.get(
  "/search",
  authenticationMiddleware,
  validate(chatSchema.searchUserSchema),
  matchesController.searchUsers
);
chatRouter.put(
  "/blockUser",
  authenticationMiddleware,
  validate(chatSchema.blockUserSchema),
  matchesController.blockUser
);

chatRouter.get(
  "/messages/:chatId",
  authenticationMiddleware,
  validate(chatSchema.getChatMessagesSchema),
  matchesController.getChatMessages
);

export default chatRouter;
