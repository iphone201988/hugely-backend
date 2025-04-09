import express from "express";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import matchesController from "../controllers/matches.controller";

const matchesRouter = express.Router();

matchesRouter.get("/", authenticationMiddleware, matchesController.getMatches);

export default matchesRouter;
