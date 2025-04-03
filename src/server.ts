import express, { Request, Response } from "express";
import "dotenv/config";
import morgan from "morgan";
import { connectToDB } from "./utils/helper.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import router from "./routes/index.js";

const app = express();

app.use(express.json());
app.use(morgan("tiny"));

app.use("/api/v1", router);

app.use("*", async (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

connectToDB()
  .then(() => {
    console.log("Connected to DB successfully", process.env.MONGO_URI);
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error connecting to DB", error);
  });
