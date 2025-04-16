import { Document } from "mongoose";

export interface UserModel extends Document {
  username: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  socialId: string;
  socialType: number;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  deviceToken: string;
  deviceType: number;
  jti: string;
  otp: number;
  otpExpiry: Date;
  otpVerified: boolean;
  isVerified: boolean;
  isDeleted: boolean;
  role: string;
  relationship: string;
  country: string;
  gender: string;
  dob: string;
  yourIntellectualDisabilities: string;
  partnerIntellectualDisabilities: string;
  bio: string;
  careTakerId: any;
  drink: string;
  likeToDate: string;
  ageGroup: string;
  interests: string[];
  photos: string[];
  profileImage: string;
  careTakerCode: string;
  isRegistrationCompleted: boolean;
  enableNotification: boolean;
  visibility: string;
  unVerifiedTempCredentials: {
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;

  // Methods
  matchPassword(password: string): Promise<boolean>;
}

export interface SwipeLogsModel extends Document {
  userId: any;
  rejectedUserIds: Array<any>;
  likeSent: Array<any>;
  receivedLikes: Array<any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatModel extends Document {
  match: Array<{ userId: any; isBlocked: boolean; isBlockedByCT: boolean }>;
  lastMessage: string;
  hasUnreadMessages: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageModel extends Document {
  chatId: any;
  senderId: any;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
