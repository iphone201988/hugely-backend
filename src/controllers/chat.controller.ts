import { Request, Response, NextFunction } from "express";
import { SUCCESS, TryCatch, getFiles } from "../utils/helper";
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
import { getRoleBasedUsers } from "../services/user.services";
import { userRole } from "../utils/enums";
import ReportUser from "../model/reportUser.model";

const getMatches = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    const userIds = await getRoleBasedUsers(user);

    const chats = await Chat.find({
      "match.userId": { $in: userIds },
    })
      .populate("match.userId", "username profileImage")
      .populate("lastMessage", "message type");

    return SUCCESS(res, 200, "Matches retrieved successfully", {
      data: { chats },
    });
  }
);

const searchUsers = TryCatch(
  async (req: Request<{}, {}, {}, SearchUsersRequest>, res: Response) => {
    const { userId, user } = req;
    const { keyword } = req.query;
    const userIds = await getRoleBasedUsers(user);

    const chats: ChatModel[] = await Chat.find({
      "match.userId": { $in: userIds },
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

const blockUnblockUser = TryCatch(
  async (
    req: Request<{}, {}, {}, BlockUserRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { userId, user } = req;
    const { chatId, blockUserId } = req.query;
    const isCareTaker = user.role == userRole.CARETAKER;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return next(new ErrorHandler("Chat not found", 404));
    }

    if (isCareTaker) {
      const userToBeBlocked = await User.findOne({
        _id: blockUserId,
        careTakerId: { $in: [userId] },
      });

      if (!userToBeBlocked)
        return next(
          new ErrorHandler(
            "You don't have access to block or unblock this user",
            400
          )
        );
    }

    const matchIndex = chat.match.findIndex(
      (match) => match.userId.toString() === blockUserId
    );

    if (matchIndex === -1) {
      return next(new ErrorHandler("You are not matched with this user", 404));
    }

    chat.match[matchIndex].isBlocked = !chat.match[matchIndex].isBlocked;
    if (isCareTaker && chat.match[matchIndex].isBlocked) {
      chat.match[matchIndex].isBlockedByCT = true;
    }

    await chat.save();

    return SUCCESS(
      res,
      200,
      `User ${
        chat.match[matchIndex].isBlocked ? "blocked" : "unblocked"
      } successfully`
    );
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

const uploadMedia = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req;
    const { chatId } = req.body;

    const chat = await Chat.find({
      _id: chatId,
      "match.userId": { $in: [userId] },
    });

    if (!chat) {
      return next(new ErrorHandler("Chat not found", 404));
    }

    const { media } = getFiles(req, ["media"]);

    return SUCCESS(res, 200, "Media uploaded successfully", {
      data: media,
    });
  }
);

const getBlockedUsers = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, user } = req;
    const userIds = getRoleBasedUsers(user);

    const chats = await Chat.find({
      "match.userId": { $in: userIds },
    });

    const blockedUsers = [];

    chats.forEach((chat) => {
      chat.match.forEach((match) => {
        if (match.userId != userId && match.isBlocked) {
          blockedUsers.push({
            chatId: chat._id,
            userId: match.userId,
            isBlockedByCT: match.isBlockedByCT,
          });
        }
      });
    });

    return SUCCESS(res, 200, "Blocked users retrieved successfully", {
      data: blockedUsers,
    });
  }
);

const reportUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId: reportedBy } = req;

    const { chatId, reportedUserId, description, type } = req.body;

    await ReportUser.create({
      chatId,
      reportedUserId,
      description,
      type,
      reportedBy,
    });

    return SUCCESS(res, 201, "User reported successfully");
  }
);

export default {
  getMatches,
  searchUsers,
  blockUnblockUser,
  getChatMessages,
  uploadMedia,
  getBlockedUsers,
  reportUser,
};
