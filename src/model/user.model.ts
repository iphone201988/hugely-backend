import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import {
  ageGroup,
  deviceType,
  drinkHabbit,
  gender,
  socialTypeEnums,
  userRole,
  visibilityEnum,
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
    },
    relationship: { type: String, default: null },
    country: { type: String, default: null },
    gender: { type: String, enum: [gender.MALE, gender.FEMALE, gender.OTHERS] },
    dob: { type: String, default: null },
    yourIntellectualDisabilities: { type: String, default: null },
    partnerIntellectualDisabilities: { type: String, default: null },
    bio: { type: String, default: null },
    careTakerId: [{ type: Schema.Types.ObjectId, ref: "user" }],
    drink: {
      type: String,
      enum: Object.values(drinkHabbit),
      default: null,
    },
    likeToDate: {
      type: String,
      enum: Object.values(gender),
      default: null,
    },
    ageGroup: {
      type: String,
      enum: Object.values(ageGroup),
      default: null,
    },
    interests: [{ type: String, default: null }],
    photos: [{ type: String }],
    profileImage: { type: String, default: null },
    careTakerCode: { type: String, default: null },
    isRegistrationCompleted: { type: Boolean, default: false },
    enableNotification: { type: Boolean, default: false },
    visibility: {
      type: String,
      enum: [visibilityEnum.PUBLIC, visibilityEnum.HIDE],
      default: visibilityEnum.PUBLIC,
    },
    unVerifiedTempCredentials: {
      email: { type: String },
    },
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

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
