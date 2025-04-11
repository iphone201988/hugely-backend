import { NextFunction, Request, Response } from "express";
import {
  SUCCESS,
  TryCatch,
  addMinutesToCurrentTime,
  generateJwtToken,
  generateOTP,
  generateRandomString,
  getFileteredUser,
  getFiles,
} from "../utils/helper";
import {
  generateUniqueCode,
  getUserByEmail,
  getUserById,
} from "../services/user.services";
import ErrorHandler from "../utils/ErrorHandler";
import User from "../model/user.model";
import { sendEmail } from "../utils/sendEmail";
import { userRole } from "../utils/enums";
import {
  ChangePasswordRequest,
  CompleteRegistrationRequest,
  LoginUserRequest,
  RegisterUserRequest,
  SendOtpRequest,
  SocilLoginRequest,
  VerifyOtpRequest,
} from "../type/API/User/types";
import SwipeLogs from "../model/swipeLogs.model";

const register = TryCatch(
  async (
    req: Request<{}, {}, RegisterUserRequest>,
    res: Response,
    next: NextFunction
  ) => {
    let {
      username,
      role,
      email,
      countryCode,
      phone,
      password,
      longitude,
      latitude,
      deviceToken,
      deviceType,
    } = req.body;
    email = email.toLowerCase();

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
        role,
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
  async (
    req: Request<{}, {}, VerifyOtpRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { userId, otp, type } = req.body; // Verification:1,Forgot:2,ChangeEmail:3
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
    if (type == 3) {
      user.email = user.unVerifiedTempCredentials.email;
      user.unVerifiedTempCredentials.email = undefined;
      user.isVerified = false;
    }
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
  async (
    req: Request<{}, {}, SendOtpRequest>,
    res: Response,
    next: NextFunction
  ) => {
    let { email, type } = req.body; // Forgot:1,Resend:2,ChangeEmail:3
    const emailTemplate = type == 1 ? 3 : type == 2 ? 4 : 5;
    email = email.toLowerCase();

    let query: any = { email };
    if (type != 2) query.isVerified = true;
    const user = await User.findOne(query);
    if (!user) return next(new ErrorHandler("User not found", 404));

    const otp = generateOTP();
    user.otp = Number(otp);
    user.otpExpiry = new Date(addMinutesToCurrentTime(2));
    user.otpVerified = false;
    await user.save();
    await sendEmail(user.email, emailTemplate, otp);

    return SUCCESS(
      res,
      200,
      `OTP ${type == 2 ? "resent" : "sent"} successfully`
    );
  }
);

const searchCareTaker = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { careTakerCode } = req.query;

    const users = await User.find({ careTakerCode }).select(
      "username relationship"
    );

    if (!users || users.length == 0)
      return next(new ErrorHandler("No CareTaker found", 404));

    return SUCCESS(res, 200, "CareTaker fetched successfully", {
      data: { users },
    });
  }
);

const completeRegistration = TryCatch(
  async (
    req: Request<{}, {}, CompleteRegistrationRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      userId,
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

    if (user.role == userRole.CARETAKER) {
      const careTakerCode = await generateUniqueCode();
      user.careTakerCode = careTakerCode;
      user.relationship = relationship;
      user.isRegistrationCompleted = true;
    }

    if (user.role == userRole.USER) {
      const { photos } = getFiles(req, ["photos"]);
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

    await SwipeLogs.create({ userId: user._id });

    return SUCCESS(res, 200, "User registration completed successfully", {
      data: {
        token,
        user: getFileteredUser(user.toObject()),
      },
    });
  }
);

const changePassword = TryCatch(
  async (
    req: Request<{}, {}, ChangePasswordRequest>,
    res: Response,
    next: NextFunction
  ) => {
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
  async (
    req: Request<{}, {}, LoginUserRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { username, password, deviceToken, deviceType, latitude, longitude } =
      req.body;

    const user = await User.findOne({ username, isDeleted: false });
    if (!user) return next(new ErrorHandler("Invalid credentials", 400));

    const isMatched = await user.matchPassword(password);
    if (!isMatched) return next(new ErrorHandler("Invalid credentials", 400));

    if (latitude && longitude) {
      user.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }
    let token: string = "";
    if (user.isRegistrationCompleted) {
      const jti = generateRandomString(20);
      token = generateJwtToken({ userId: user._id, jti });
      user.jti = jti;
      user.deviceToken = deviceToken;
      user.deviceType = deviceType;
    }
    await user.save();

    return SUCCESS(res, 200, "LoggedIn successfully", {
      data: {
        token: token ? token : undefined,
        user: getFileteredUser(user.toObject()),
      },
    });
  }
);

const socialLogin = TryCatch(
  async (
    req: Request<{}, {}, SocilLoginRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      socialId,
      email,
      role,
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

    user.deviceToken = deviceToken;
    user.deviceType = deviceType;

    if (latitude && longitude)
      user.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };

    if (profileImage) user.profileImage = profileImage;

    let token = "";

    if (isUserExists && user.isRegistrationCompleted) {
      const jti = generateRandomString(20);
      user.jti = jti;
      token = generateJwtToken({ userId: user._id, jti });
    }

    if (isUserExists && !user.role) {
      user.role = role;
      user.isVerified = true;
    }

    await user.save();
    let updatedProfileImage = null;
    if (user?.profileImage) {
      if (user.profileImage.includes("https")) {
        updatedProfileImage = user.profileImage;
      } else {
        updatedProfileImage = process.env.AWS_S3_URI + user.profileImage;
      }
    }

    return SUCCESS(res, 200, "User logged in successfully", {
      data: {
        token: token ? token : null,
        user: getFileteredUser(user.toObject()),
      },
    });
  }
);

const updateUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    let {
      username,
      countryCode,
      phone,
      bio,
      yourIntellectualDisabilities,
      interests,
      careTakerId,
      enableNotification,
      visibility,
    } = req.body;

    const images = getFiles(req, ["profileImage"]);

    if (username) user.username = username;
    if (images?.profileImage) user.profileImage = images.profileImage[0];
    if (phone && countryCode) {
      user.countryCode = countryCode;
      user.phone = phone;
    }
    if (bio) user.bio = bio;
    if (enableNotification) user.enableNotification = enableNotification;
    if (visibility) user.visibility = visibility;
    if (yourIntellectualDisabilities) {
      user.yourIntellectualDisabilities = yourIntellectualDisabilities;
    }
    if (interests) {
      user.interests = interests.includes(",")
        ? interests.split(",")
        : [interests];
    }
    if (careTakerId) {
      user.careTakerId = careTakerId.includes(",")
        ? careTakerId.split(",")
        : careTakerId;
    }

    await user.save();
    return SUCCESS(res, 200, "User updated successfully");
  }
);

const changeCredentials = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    const { email } = req.body;
    const isUserExists = await getUserByEmail(email);
    if (isUserExists)
      return next(new ErrorHandler("User already exist with this email", 404));

    const otp = generateOTP();
    user.otp = Number(otp);
    user.otpExpiry = new Date(addMinutesToCurrentTime(2));
    user.otpVerified = false;
    user.unVerifiedTempCredentials.email = email;
    await user.save();
    await sendEmail(user.email, 5, otp);

    return SUCCESS(res, 200, "Verification code has been sent to your email");
  }
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

const getUserProfile = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const user = await getUserById(userId);

    return SUCCESS(res, 200, "User fetched successfully", {
      data: {
        user: getFileteredUser(user.toObject()),
      },
    });
  }
);

const resetPassword = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    const { oldPassword, password } = req.body;
    const isMatched = user.matchPassword(oldPassword);

    if (!isMatched)
      return next(new ErrorHandler("Old password is incorrect", 400));

    user.password = password;
    await user.save();
    return SUCCESS(res, 200, "Password changed successfully");
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

const removeAccount = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    user.isDeleted = true;
    await user.save();
    return SUCCESS(res, 200, "User account deleted successfully");
  }
);

export default {
  register,
  completeRegistration,
  verifyOtp,
  sendOtp,
  searchCareTaker,
  changePassword,
  login,
  socialLogin,
  updateUser,
  changeCredentials,
  getUser,
  getUserProfile,
  resetPassword,
  logout,
  removeAccount,
};
