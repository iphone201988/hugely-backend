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

  // Methods
  matchPassword(password: string): Promise<boolean>;
}
