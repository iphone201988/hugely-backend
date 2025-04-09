import { Schema, model } from "mongoose";
import { SwipeLogsModel } from "../type/Database/types";

const swipeLogsSchema = new Schema<SwipeLogsModel>({
  userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
  rejectedUserIds: [{ type: Schema.Types.ObjectId, ref: "user" }],
  likeSent: [{ type: Schema.Types.ObjectId, ref: "user" }],
  receivedLikes: [{ type: Schema.Types.ObjectId, ref: "user" }],
});

const SwipeLogs = model<SwipeLogsModel>("swipeLogs", swipeLogsSchema);
export default SwipeLogs;
