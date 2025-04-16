import { DefaultEventsMap, Server, Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ChatModel } from "../type/Database/types";
import Chat from "../model/chat.model";
import { messageTypeEnum } from "../utils/enums";
import Message from "../model/message.model";

interface CustomSocket extends Socket {
  userId?: string;
}

const useSockets = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  const users = new Map<string, string>();

  const addUser = (userId: string, socketId: string) => {
    users.set(userId, socketId);
  };

  const removeUser = (socketId: string) => {
    users.forEach((value, key) => {
      if (value === socketId) {
        users.delete(key);
      }
    });
  };

  const getUser = (userId: string) => {
    return users.get(userId);
  };

  io.use((socket: CustomSocket, next) => {
    const token: any = socket.handshake.headers.token;
    if (!token) {
      return next(new Error("Authentication failed. Missing token."));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      if (!decoded) {
        return next(new Error("Authentication failed. Invalid token."));
      }

      socket.userId = decoded.userId;

      next();
    } catch (err) {
      return next(new Error("Authentication failed. Invalid token."));
    }
  });

  io.on("connection", (socket: CustomSocket) => {
    addUser(socket.userId, socket.id);

    socket.on("sendMessage", async (payload: any) => {
      const { message, chatId, type } = payload;
      try {
        const chat: ChatModel = await Chat.findById(chatId);

        if (!chat) {
          return socket.emit("error", "Chat not found");
        }

        const user = chat.match.find(
          (match) => match.userId.toString() == socket.userId
        );

        const receiver = chat.match.find(
          (match) => match.userId.toString() != socket.userId
        );

        const isBlocked = receiver?.isBlocked || user?.isBlocked;

        if (isBlocked) {
          return socket.emit("error", "You cannot send messages to this user");
        }

        const receiverId = receiver.userId.toString();

        const receiverSocketId = getUser(receiverId);

        const newMessage = await Message.create({
          chatId,
          senderId: socket.userId,
          message,
          type,
        });

        chat.lastMessage = newMessage._id;
        chat.hasUnreadMessages = true;
        await chat.save();

        if (receiverSocketId && !isBlocked) {
          io.to(receiverSocketId).emit("receiveMessage", newMessage);
        }
      } catch (error) {
        console.log("error:::", error);
        return socket.emit(
          "error",
          "An error occurred while sending the message"
        );
      }
    });

    socket.on("disconnect", () => {
      removeUser(socket.id);
    });
  });
};

export default useSockets;
