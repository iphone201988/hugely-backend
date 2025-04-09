import express from "express";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import swipeController from "../controllers/swipe.controller";
import validate from "../middleware/validate.middleware";
import swipeSchema from "../schema/swipe.schema";

const swipeRouter = express.Router();

swipeRouter.get(
  "/",
  authenticationMiddleware,
  validate(swipeSchema.swipeUsersSchema),
  swipeController.swipeUsers
);
swipeRouter.get(
  "/likes",
  authenticationMiddleware,
  validate(swipeSchema.getLikesSchema),
  swipeController.getLikes
);
swipeRouter.post(
  "/sendLike",
  authenticationMiddleware,
  validate(swipeSchema.sendLikeSchema),
  swipeController.sendLike
);
swipeRouter.post(
  "/rejectUser",
  authenticationMiddleware,
  validate(swipeSchema.rejectUserSchema),
  swipeController.rejectUser
);
swipeRouter.get(
  "/search",
  authenticationMiddleware,
  validate(swipeSchema.searchUsersSchema),
  swipeController.searchUsers
);

export default swipeRouter;
