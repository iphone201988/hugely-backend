import { Schema, model } from "mongoose";
import { messageTypeEnum } from "../utils/enums";
import { MessageModel } from "../type/Database/types";

const messageSchema = new Schema<MessageModel>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "chats", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        messageTypeEnum.TEXT,
        messageTypeEnum.AUDIO,
        messageTypeEnum.VIDEO,
        messageTypeEnum.IMAGE,
      ],
      default: messageTypeEnum.TEXT,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = model<MessageModel>("messages", messageSchema);

export default Message;
