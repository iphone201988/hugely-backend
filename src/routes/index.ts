import express from "express";
import userRouter from "./user.routes";
import swipeRouter from "./swipe.routes";
import matchesRouter from "./matches.routes";

const router = express.Router();

router.use("/user", userRouter);
router.use("/swipe", swipeRouter);
router.use("/match", matchesRouter);

export default router;
