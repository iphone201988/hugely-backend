import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import {
  ageGroup,
  deviceType,
  drinkHabbit,
  gender,
  socialTypeEnums,
  userRole,
} from "../utils/enums";
import { UserModel } from "../type/Database/types";

const userSchema = new Schema<UserModel>(
  {
    username: { type: String, require: true, unique: true },
    email: { type: String, require: true, unique: true },
    countryCode: { type: String, require: true },
    phone: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    socialId: { type: String },
    socialType: {
      type: Number,
      enum: Object.values(socialTypeEnums),
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    deviceToken: { type: String, require: true },
    deviceType: {
      type: Number,
      enum: [deviceType.IOS, deviceType.ANDROID],
      require: true,
    },
    jti: { type: String },
    otp: { type: Number },
    otpExpiry: { type: Date },
    otpVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    role: {
      type: String,
      enum: [userRole.USER, userRole.CARETAKER],
      require: true,
    },
    relationship: { type: String },
    country: { type: String },
    gender: { type: String, enum: [gender.MALE, gender.FEMALE, gender.OTHERS] },
    dob: { type: String },
    yourIntellectualDisabilities: { type: String },
    partnerIntellectualDisabilities: { type: String },
    bio: { type: String },
    careTakerId: [{ type: Schema.Types.ObjectId, ref: "user" }],
    drink: {
      type: String,
      enum: Object.values(drinkHabbit),
    },
    likeToDate: {
      type: String,
      enum: Object.values(gender),
    },
    ageGroup: {
      type: String,
      enum: Object.values(ageGroup),
    },
    interests: [{ type: String }],
    photos: [{ type: String }],
    profileImage: { type: String },
    careTakerCode: { type: String },
    isRegistrationCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
  }
});

userSchema.methods.matchPassword = async function (password: string) {
  if (!this.password) return false;
  const isCompared = await bcrypt.compare(password, this.password);
  return isCompared;
};

const User = model<UserModel>("user", userSchema);
export default User;
