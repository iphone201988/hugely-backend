import { Request, Response, NextFunction } from "express";
import { SUCCESS, TryCatch } from "../utils/helper";
import { userRole } from "../utils/enums";
import Matches from "../model/matches.model";
import User from "../model/user.model";

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

    const matches = await Matches.find({ match: { $in: userIds } }).populate(
      "match",
      "username profileImage"
    );

    return SUCCESS(res, 200, "Matches retrieved successfully", {
      data: { matches },
    });
  }
);

export default {
  getMatches,
};
