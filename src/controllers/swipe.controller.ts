import { NextFunction, Request, Response } from "express";
import { SUCCESS, TryCatch } from "../utils/helper";
import User from "../model/user.model";
import SwipeLogs from "../model/swipeLogs.model";
import ErrorHandler from "../utils/ErrorHandler";
import { GetLikesRequest, SwipeUsersRequest } from "../type/API/Swipe/types";
import { userRole } from "../utils/enums";
import Chat from "../model/chat.model";

const swipeUsers = TryCatch(
  async (
    req: Request<{}, {}, {}, SwipeUsersRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { user } = req;
    const { page = 1 } = req.query;
    const [lng, lat] = user.location.coordinates;

    const swipeLogs = await SwipeLogs.findOne({ userId: user._id });
    const likedUserIds = swipeLogs?.likeSent || [];
    const rejectedUserIds = swipeLogs?.rejectedUserIds || [];
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalCount = await User.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "dist.calculated",
          spherical: true,
          query: {
            $or: [
              { interests: { $in: user.interests } },
              { ageGroup: user.ageGroup },
            ],
          },
        },
      },
      {
        $match: {
          $and: [
            { _id: { $ne: user._id } },
            { _id: { $nin: likedUserIds } },
            { _id: { $nin: rejectedUserIds } },
            { role: userRole.USER },
          ],
        },
      },
      {
        $count: "total",
      },
    ]);

    const total = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const users = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat],
          },
          distanceField: "dist.calculated",
          spherical: true,
          query: {
            $or: [
              { interests: { $in: user.interests } },
              { ageGroup: user.ageGroup },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "swipeLogs",
          localField: "_id",
          foreignField: "userId",
          as: "swipeLogs",
        },
      },
      {
        $match: {
          $and: [
            { _id: { $ne: user._id } },
            { _id: { $nin: likedUserIds } },
            { _id: { $nin: rejectedUserIds } },
            { role: userRole.USER },
          ],
        },
      },
      {
        $project: {
          username: 1,
          profileImage: 1,
          userId: 1,
          senderId: 1,
          lastMessage: 1,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    return SUCCESS(res, 200, "Friends found successfully", {
      data: users,
      pagination: {
        totalPages,
        page,
        limit,
      },
    });
  }
);

const rejectUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req;
    const { rejectedUserId } = req.body;

    let swipeLogs = await SwipeLogs.findOne({ userId });
    if (!swipeLogs) swipeLogs = await SwipeLogs.create({ userId });

    const isAlreadyRejected = swipeLogs.rejectedUserIds.find(
      (id) => id.toString() === rejectedUserId
    );
    const isAlreadyLiked = swipeLogs.likeSent.find(
      (id) => id.toString() === rejectedUserId
    );

    if (isAlreadyRejected) {
      return next(new ErrorHandler("User already rejected", 400));
    }
    if (isAlreadyLiked) {
      return next(new ErrorHandler("User already liked", 400));
    }

    swipeLogs.rejectedUserIds.push(rejectedUserId);
    await swipeLogs.save();
    return SUCCESS(res, 200, "User rejected successfully");
  }
);

const sendLike = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, user } = req;
    const { likedUserId } = req.body;

    let [swipeLogs, likedUserSwipeLogs] = await Promise.all([
      SwipeLogs.findOne({ userId }),
      SwipeLogs.findOne({ userId: likedUserId }),
    ]);

    // REMOVEABLE
    if (!swipeLogs) swipeLogs = await SwipeLogs.create({ userId });
    if (!likedUserSwipeLogs)
      likedUserSwipeLogs = await SwipeLogs.create({ userId: likedUserId });

    const isAlreadyLiked = swipeLogs.likeSent.find(
      (id) => id.toString() === likedUserId
    );

    const isAlreadyRejected = swipeLogs.rejectedUserIds.find(
      (id) => id.toString() === likedUserId
    );

    if (isAlreadyLiked) {
      return next(new ErrorHandler("User already liked", 400));
    }
    if (isAlreadyRejected) {
      return next(new ErrorHandler("User already rejected", 400));
    }

    swipeLogs.likeSent.push(likedUserId);
    likedUserSwipeLogs.receivedLikes.push(userId);

    await Promise.all([swipeLogs.save(), likedUserSwipeLogs.save()]);

    const receivedLike = swipeLogs.receivedLikes.find(
      (id) => id.toString() === likedUserId
    );

    if (receivedLike) {
      await Chat.create({
        match: [{ userId }, { userId: likedUserId }],
        hasUnreadMessages: false,
      });
    }

    return SUCCESS(res, 200, "Like sent successfully");
  }
);

const getLikes = TryCatch(
  async (
    req: Request<{}, {}, {}, GetLikesRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { userId, user } = req;
    const { likeSent, page = 1 } = req.query;

    const isCareTaker = user.role == userRole.CARETAKER;
    const userIds = [];
    const limit = 10;
    const skip = (page - 1) * 10;

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

    const key = likeSent == "true" ? "likeSent" : "receivedLikes";
    const count = await SwipeLogs.findOne({
      userId: { $in: userIds },
    }).countDocuments();
    const totalPages = Math.ceil(count / limit);

    const swipeLogs = await SwipeLogs.findOne({ userId: { $in: userIds } })
      .select(key)
      .populate(key, "username profileImage");

    return SUCCESS(res, 200, "Likes retrieved successfully", {
      data: swipeLogs ? swipeLogs[key] : {},
    });
  }
);

const searchUsers = TryCatch(async (req: Request, res: Response) => {
  const { userId } = req;
  const { search } = req.query;

  const swipeLogs = await SwipeLogs.findOne({ userId });
  const likedUserIds = swipeLogs?.likeSent || [];
  const rejectedUserIds = swipeLogs?.rejectedUserIds || [];

  const users = await User.find({
    _id: {
      $and: [
        { $ne: userId },
        { $nin: likedUserIds },
        { $nin: rejectedUserIds },
      ],
    },
    username: { $regex: search, $options: "i" },
  }).select("username profileImage");

  return SUCCESS(res, 200, "Users found successfully", {
    data: users,
  });
});

export default {
  swipeUsers,
  rejectUser,
  sendLike,
  getLikes,
  searchUsers,
};
