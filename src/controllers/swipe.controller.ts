import { NextFunction, Request, Response } from "express";
import { SUCCESS, TryCatch } from "../utils/helper";
import User from "../model/user.model";
import SwipeLogs from "../model/swipeLogs.model";
import ErrorHandler from "../utils/ErrorHandler";
import { GetLikesRequest, SwipeUsersRequest } from "../type/API/Swipe/types";
import { userRole } from "../utils/enums";
import Matches from "../model/matches.model";

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
          ],
        },
      },
      {
        $project: {
          username: 1,
          profileImage: 1,
          userId: 1,
        },
      },
    ]);

    return SUCCESS(res, 200, "Friends found successfully", { data: users });
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
    const { userId } = req;
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
      await Matches.create({
        match: [userId, likedUserId],
        lastMessage: "",
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
    let { likeSent, page = 1 } = req.query;
    likeSent = Boolean(likeSent);
    const isCareTaker = user.role == userRole.CARETAKER;
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

    const key = likeSent ? "likeSent" : "receivedLikes";
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
