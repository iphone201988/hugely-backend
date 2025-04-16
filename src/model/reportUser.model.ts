import { Schema, model } from "mongoose";
import { reportTypeEnum } from "../utils/enums";

const reportUserSchema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "chats" },
    reportedUserId: { type: Schema.Types.ObjectId, ref: "user" },
    reportedBy: { type: Schema.Types.ObjectId, ref: "user" },
    description: { type: String },
    type: {
      type: String,
      enum: [...Object.values(reportTypeEnum)],
    },
  },
  { timestamps: true }
);

const ReportUser = model("reportUser", reportUserSchema);
export default ReportUser;
