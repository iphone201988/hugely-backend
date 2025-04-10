import express from "express";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import swipeController from "../controllers/swipe.controller";
import validate from "../middleware/validate.middleware";
import swipeSchema from "../schema/swipe.schema";
import { roleAccessMiddleware } from "../middleware/role.middleware";
import { userRole } from "../utils/enums";

const swipeRouter = express.Router();

swipeRouter.get(
  "/",
  authenticationMiddleware,
  roleAccessMiddleware(userRole.USER),
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
  roleAccessMiddleware(userRole.USER),
  validate(swipeSchema.sendLikeSchema),
  swipeController.sendLike
);
swipeRouter.post(
  "/rejectUser",
  authenticationMiddleware,
  roleAccessMiddleware(userRole.USER),
  validate(swipeSchema.rejectUserSchema),
  swipeController.rejectUser
);
swipeRouter.get(
  "/search",
  authenticationMiddleware,
  roleAccessMiddleware(userRole.USER),
  validate(swipeSchema.searchUsersSchema),
  swipeController.searchUsers
);

export default swipeRouter;
