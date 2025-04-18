import express, { Request, Response } from "express";
import "dotenv/config";
import morgan from "morgan";
import { errorMiddleware } from "./middleware/error.middleware.js";
import router from "./routes/index.js";
import path from "path";
import { Server } from "socket.io";
import useSockets from "./sockets/index.js";
import http from "http";

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("tiny"));

const io = new Server(server);
useSockets(io);

app.use("/uploads", express.static(path.join(__dirname, "../src/uploads")));

app.use("/api/v1", router);

app.use("*", async (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

export default server;
