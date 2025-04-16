import { Schema, model } from "mongoose";
import { ChatModel } from "../type/Database/types";

const chatSchema = new Schema<ChatModel>(
  {
    match: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "user" },
        isBlocked: { type: Boolean, default: false },
        isBlockedByCT: { type: Boolean, default: false },
      },
    ],
    lastMessage: { type: String },
    hasUnreadMessages: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Chat = model<ChatModel>("chats", chatSchema);
export default Chat;
