import { NextFunction, Request, Response } from "express";
import {
  SUCCESS,
  TryCatch,
  addMinutesToCurrentTime,
  generateJwtToken,
  generateOTP,
  generateRandomString,
  getFileteredUser,
  getImages,
} from "../utils/helper";
import { generateUniqueCode, getUserById } from "../services/user.services";
import ErrorHandler from "../utils/ErrorHandler";
import User from "../model/user.model";
import { sendEmail } from "../utils/sendEmail";
import { userRole } from "../utils/enums";

const register = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      username,
      email,
      countryCode,
      phone,
      password,
      longitude,
      latitude,
      deviceToken,
      deviceType,
    } = req.body;

    let user = await User.findOne({
      email,
      countryCode,
      phone,
    });

    if (user?.isVerified)
      return next(new ErrorHandler("User already exists", 400));

    if (!user) {
      user = await User.create({
        username,
        email,
        countryCode,
        phone,
        password,
        deviceToken,
        deviceType,
      });
    }

    if (latitude && longitude)
      user.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };

    const otp = generateOTP();
    user.otp = Number(otp);
    user.otpExpiry = new Date(addMinutesToCurrentTime(2));
    await user.save();
    await sendEmail(email, 1, otp);

    return SUCCESS(res, 201, "Verification code has been sent to your email", {
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
    });
  }
);

const verifyOtp = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, otp, type } = req.body; // Verification:1,Forgot:2
    const user = await getUserById(userId);
    const now = new Date();

    if (user.otpExpiry < now) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return next(new ErrorHandler("OTP has been expired", 400));
    }

    if (user.otp != otp) return next(new ErrorHandler("Invalid OTP", 400));

    user.otp = undefined;
    user.otpExpiry = undefined;
    if (type == 1) user.isVerified = true;
    user.otpVerified = true;
    await user.save();
    return SUCCESS(res, 200, `OTP verified successfully`, {
      data: {
        userId: user._id,
        role: user.role,
      },
    });
  }
);

const sendOtp = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, type } = req.body; // Forgot:1,Resend:2

    let query: any = { email };
    if (type == 1) query.isVerified = true;
    const user = await User.findOne(query);
    if (!user) return next(new ErrorHandler("User not found", 404));

    const otp = generateOTP();
    user.otp = Number(otp);
    user.otpExpiry = new Date(addMinutesToCurrentTime(2));
    user.otpVerified = false;
    await user.save();
    await sendEmail(user.email, 1, otp);

    return SUCCESS(
      res,
      200,
      `OTP ${type == 1 ? "sent" : "resent"} successfully`
    );
  }
);

const completeRegistration = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      userId,
      role,
      relationship,
      country,
      gender,
      dob,
      yourIntellectualDisabilities,
      interests,
      drink,
      likeToDate,
      partnerIntellectualDisabilities,
      ageGroup,
      bio,
      careTakerId,
    } = req.body;

    const user = await getUserById(userId);

    if (user.isRegistrationCompleted)
      return next(
        new ErrorHandler("User registration is already completed", 400)
      );
    if (!user.isVerified)
      return next(new ErrorHandler("Please verify your account", 400));

    if (role == userRole.CARETAKER) {
      const careTakerCode = await generateUniqueCode();
      user.careTakerCode = careTakerCode;
      user.relationship = relationship;
      user.isRegistrationCompleted = true;
    }

    if (role == userRole.USER) {
      const { photos } = getImages(req, ["photos"]);
      if (photos.length < 2) {
        return next(new ErrorHandler("Minimum 2 photos are required", 400));
      }
      user.country = country;
      user.gender = gender;
      user.dob = dob;
      user.yourIntellectualDisabilities = yourIntellectualDisabilities;
      user.interests = interests.includes(",")
        ? interests.split(",")
        : [interests];
      user.drink = drink;
      user.likeToDate = likeToDate;
      user.partnerIntellectualDisabilities = partnerIntellectualDisabilities;
      if (ageGroup) user.ageGroup = ageGroup;
      if (bio) user.bio = bio;
      if (careTakerId)
        user.careTakerId = careTakerId.includes(",")
          ? careTakerId.split(",")
          : careTakerId;
      user.photos = photos;
      user.isRegistrationCompleted = true;
    }

    const jti = generateRandomString(20);
    const token = generateJwtToken({ userId: user._id, jti });
    user.jti = jti;
    user.otpVerified = false;
    await user.save();

    return SUCCESS(res, 200, "User registration completed successfully", {
      data: {
        token,
        user: getFileteredUser(user.toObject()),
      },
    });
  }
);

const changePassword = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, password } = req.body;
    const user = await getUserById(userId);

    if (!user.otpVerified)
      return next(new ErrorHandler("User OTP is not verified", 400));

    user.password = password;
    user.otpVerified = false;
    await user.save();
    return SUCCESS(res, 200, "Password changed successfully");
  }
);

const login = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, password, deviceToken, deviceType, latitude, longitude } =
      req.body;

    const user = await User.findOne({ username });
    if (!user) return next(new ErrorHandler("Invalid credentials", 400));

    const isMatched = await user.matchPassword(password);
    if (!isMatched) return next(new ErrorHandler("Invalid credentials", 400));

    if (latitude && longitude)
      user.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };

    const jti = generateRandomString(20);
    const token = generateJwtToken({ userId: user._id, jti });
    user.jti = jti;
    user.deviceToken = deviceToken;
    user.deviceType = deviceType;
    await user.save();

    return SUCCESS(res, 200, "LoggedIn successfully", {
      data: {
        token,
        user: getFileteredUser(user.toObject()),
      },
    });
  }
);
const socialLogin = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      socialId,
      email,
      username,
      profileImage,
      longitude,
      latitude,
      socialType,
      deviceToken,
      deviceType,
    } = req.body;

    let user = await User.findOne({
      socialId,
      email,
      isDeleted: false,
    });
    let isUserExists = true;

    if (!user) {
      isUserExists = false;
      user = await User.create({
        username,
        email,
        socialId,
        socialType,
      });
    }
    const jti = generateRandomString(20);
    user.jti = jti;
    user.deviceToken = deviceToken;
    user.deviceType = deviceType;

    if (latitude && longitude)
      user.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };

    if (profileImage) user.profileImage = profileImage;

    await user.save();

    const token = generateJwtToken({ id: user._id, jti });

    let updatedProfileImage = null;
    if (user?.profileImage) {
      if (user.profileImage.includes("https")) {
        updatedProfileImage = user.profileImage;
      } else {
        updatedProfileImage = process.env.AWS_S3_URI + user.profileImage;
      }
    }

    res.status(200).json({
      success: true,
      token,
      user: getFileteredUser(user.toObject()),
    });
  }
);

const updateUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {}
);

const getUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    return SUCCESS(res, 200, "User fetched successfully", {
      data: {
        user: getFileteredUser(user.toObject()),
      },
    });
  }
);
const logout = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    user.jti = undefined;
    await user.save();
    return SUCCESS(res, 200, "User logged out successfully");
  }
);

export default {
  register,
  completeRegistration,
  verifyOtp,
  sendOtp,
  changePassword,
  login,
  socialLogin,
  updateUser,
  getUser,
  logout,
};
