import { Request, Response, NextFunction } from "express";
import { SUCCESS, TryCatch } from "../utils/helper";
import { userRole } from "../utils/enums";
import Chat from "../model/chat.model";
import User from "../model/user.model";
import { ChatModel } from "../type/Database/types";
import ErrorHandler from "../utils/ErrorHandler";
import Message from "../model/message.model";
import {
  BlockUserRequest,
  GetChatMessagesRequest,
  SearchUsersRequest,
} from "../type/API/Chat";

const getMatches = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, user } = req;
    const isCareTaker = user.role === userRole.CARETAKER;
    const userIds = [];

    if (isCareTaker) {
      const users = await User.find({ careTakerId: { $in: [userId] } }).select(
        "_id"
      );

      users.forEach((user) => {
        userIds.push(user._id);
      });
    } else {
      userIds.push(userId);
    }

    const chats = await Chat.find({
      "match.userId": { $in: userIds },
    }).populate("match.userId", "username profileImage");

    return SUCCESS(res, 200, "Matches retrieved successfully", {
      data: { chats },
    });
  }
);

const searchUsers = TryCatch(
  async (req: Request<{}, {}, {}, SearchUsersRequest>, res: Response) => {
    const { userId } = req;
    const { keyword } = req.query;

    const chats: ChatModel[] = await Chat.find({
      "match.userId": { $in: [userId] },
    });

    const otherUserIds = [];
    chats.forEach((chat: any) => {
      chat.match.forEach((item: any) => {
        if (item.userId.toString() !== userId.toString()) {
          otherUserIds.push(item.userId);
        }
      });
    });

    const users = await User.find({
      _id: { $in: otherUserIds },
      username: { $regex: keyword, $options: "i" },
    }).select("username profileImage");

    return SUCCESS(res, 200, "Users found successfully", {
      data: users,
    });
  }
);

const blockUser = TryCatch(
  async (
    req: Request<{}, {}, {}, BlockUserRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { chatId, blockUserId } = req.query;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return next(new ErrorHandler("Chat not found", 404));
    }

    const matchIndex = chat.match.findIndex(
      (match) => match.userId.toString() === blockUserId
    );

    if (matchIndex === -1) {
      return next(new ErrorHandler("You are not matched with this user", 404));
    }

    chat.match[matchIndex].isBlocked = true;
    await chat.save();

    return SUCCESS(res, 200, "User blocked successfully");
  }
);

const getChatMessages = TryCatch(
  async (
    req: Request<GetChatMessagesRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { userId } = req;
    const { chatId } = req.params;

    const chat = await Chat.find({
      _id: chatId,
      "match.userId": { $in: [userId] },
    });

    if (!chat) return new ErrorHandler("Chat not found", 404);

    const messages = await Message.find({ chatId });

    const messageIds = messages.map((message) => message._id);

    await Message.updateMany(
      { _id: { $in: messageIds }, senderId: userId },
      { $set: { isRead: true } }
    );

    return SUCCESS(res, 200, "Messages retrieved successfully", {
      data: { messages },
    });
  }
);

export default {
  getMatches,
  searchUsers,
  blockUser,
  getChatMessages,
};
