import Joi, { number } from "joi";
import {
  ObjectIdValidation,
  emailValidation,
  numberValidation,
  passwordValidation,
  stringValidation,
} from ".";
import {
  ageGroup,
  deviceType,
  drinkHabbit,
  gender,
  socialTypeEnums,
  userRole,
  visibilityEnum,
} from "../utils/enums";

const registerUserSchema = {
  body: Joi.object({
    username: stringValidation("Username"),
    role: Joi.string()
      .valid(...Object.values(userRole))
      .required()
      .messages({
        "string.base": `Role must be a string.`,
        "any.required": `Role is required.`,
        "any.only": `Role must be one of: ${Object.values(userRole).join(
          ", "
        )}.`,
      }),
    email: emailValidation(),
    countryCode: stringValidation("Country code"),
    phone: stringValidation("Phone"),
    password: passwordValidation(),
    latitude: Joi.number().min(-90).max(90).required().messages({
      "any.required": "Latitude is required.",
      "number.base": "Latitude must be a number.",
      "number.min": "Latitude must be between -90 and 90.",
      "number.max": "Latitude must be between -90 and 90.",
    }),

    longitude: Joi.number().min(-180).max(180).required().messages({
      "any.required": "Longitude is required.",
      "number.base": "Longitude must be a number.",
      "number.min": "Longitude must be between -180 and 180.",
      "number.max": "Longitude must be between -180 and 180.",
    }),
    deviceToken: stringValidation("Device Token"),
    deviceType: Joi.number()
      .valid(...Object.values(deviceType))
      .required()
      .messages({
        "number.base": `Device Type must be a number.`,
        "any.only": `Device Type must be one of: ${Object.values(
          deviceType
        ).join(", ")}.`,
        "any.required": `Device Type is required.`,
      }),
  }),
};

const verifyOTPSchema = {
  body: Joi.object({
    userId: ObjectIdValidation("UserID"),
    otp: numberValidation("OTP"),
    type: Joi.number().valid(1, 2).required().messages({
      "any.required": "Type is required.",
      "number.base": "Type must be a number.",
      "any.only": "Type must be either 1 or 2.",
    }),
  }),
};

const sendOTPSchema = {
  body: Joi.object({
    email: emailValidation(),
    type: Joi.number().valid(1, 2).required().messages({
      "any.required": "Type is required.",
      "number.base": "Type must be a number.",
      "any.only": "Type must be either 1 or 2.",
    }),
  }),
};

const completeRegistrationSchema = {
  body: Joi.object({
    userId: ObjectIdValidation("UserID"),
    relationship: stringValidation("Relationship", false),
    country: stringValidation("Country", false),

    gender: Joi.string()
      .valid(...Object.values({ ...gender }))
      .optional()
      .messages({
        "string.empty": "Gender cannot be empty.",
        "string.base": "Gender must be a string.",
        "any.only": `Gender must be one of: ${Object.values(gender).join(
          ", "
        )}.`,
      }),

    dob: Joi.date().optional().messages({
      "date.base": `Date of birth must be a valid date.`,
    }),

    yourIntellectualDisabilities: stringValidation(
      "Your Intellectual Disabilities",
      false
    ),
    interests: stringValidation("Interests", false),

    drink: Joi.string()
      .valid(...Object.values(drinkHabbit))
      .optional()
      .messages({
        "any.required": "Drink preference is required.",
        "string.empty": "Drink preference cannot be empty.",
        "string.base": "Drink preference must be a string.",
        "any.only": `Drink preference must be one of: ${Object.values(
          drinkHabbit
        ).join(", ")}.`,
      }),

    likeToDate: Joi.string()
      .valid(...Object.values(gender))
      .optional()
      .messages({
        "any.required": "Like to Date preference is required.",
        "string.empty": "Like to Date cannot be empty.",
        "string.base": "Like to Date must be a string.",
        "any.only": `Like to Date must be one of: ${Object.values(gender).join(
          ", "
        )}.`,
      }),
    partnerIntellectualDisabilities: stringValidation(
      "Partner Intellectual Disabilities preference",
      false
    ),

    ageGroup: Joi.string()
      .valid(...Object.values(ageGroup))
      .optional()
      .messages({
        "any.required": "Age Group is required.",
        "string.empty": "Age Group cannot be empty.",
        "string.base": "Age Group must be a string.",
        "any.only": `Age Group must be one of: ${Object.values(ageGroup).join(
          ", "
        )}.`,
      }),
    bio: stringValidation("Bio", false),

    careTakerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        "string.base": `CareTaker ID should be a type of text`,
        "string.empty": `CareTaker ID cannot be empty`,
        "string.pattern.base": `CareTaker ID must be a valid ObjectId`,
        "any.required": `CareTaker ID is required.`,
      }),
  }),
};

const socialLoginSchema = {
  body: Joi.object({
    socialId: stringValidation("Social ID"),
    email: emailValidation(),
    username: stringValidation("Username"),
    profileImage: stringValidation("Profile Image"),
    role: Joi.string()
      .valid(...Object.values(userRole))
      .optional()
      .messages({
        "string.base": `Role must be a string.`,
        "any.only": `Role must be one of: ${Object.values(userRole).join(
          ", "
        )}.`,
      }),
    latitude: Joi.number().min(-90).max(90).required().messages({
      "any.required": "Latitude is required.",
      "number.base": "Latitude must be a number.",
      "number.min": "Latitude must be between -90 and 90.",
      "number.max": "Latitude must be between -90 and 90.",
    }),

    longitude: Joi.number().min(-180).max(180).required().messages({
      "any.required": "Longitude is required.",
      "number.base": "Longitude must be a number.",
      "number.min": "Longitude must be between -180 and 180.",
      "number.max": "Longitude must be between -180 and 180.",
    }),
    socialType: Joi.number()
      .valid(...Object.values(socialTypeEnums))
      .required()
      .messages({
        "number.base": `Device Type must be a number.`,
        "any.only": `Device Type must be one of: ${Object.values(
          deviceType
        ).join(", ")}.`,
        "any.required": `Device Type is required.`,
      }),
    deviceToken: stringValidation("Device Token"),
    deviceType: Joi.number()
      .valid(...Object.values(deviceType))
      .required()
      .messages({
        "number.base": `Device Type must be a number.`,
        "any.only": `Device Type must be one of: ${Object.values(
          deviceType
        ).join(", ")}.`,
        "any.required": `Device Type is required.`,
      }),
  }),
};

const loginSchema = {
  body: Joi.object({
    username: stringValidation("Username"),
    password: passwordValidation(),
    latitude: Joi.number().min(-90).max(90).required().messages({
      "any.required": "Latitude is required.",
      "number.base": "Latitude must be a number.",
      "number.min": "Latitude must be between -90 and 90.",
      "number.max": "Latitude must be between -90 and 90.",
    }),

    longitude: Joi.number().min(-180).max(180).required().messages({
      "any.required": "Longitude is required.",
      "number.base": "Longitude must be a number.",
      "number.min": "Longitude must be between -180 and 180.",
      "number.max": "Longitude must be between -180 and 180.",
    }),
    deviceToken: stringValidation("Device Token"),
    deviceType: Joi.number()
      .valid(...Object.values(deviceType))
      .required()
      .messages({
        "number.base": `Device Type must be a number.`,
        "any.only": `Device Type must be one of: ${Object.values(
          deviceType
        ).join(", ")}.`,
        "any.required": `Device Type is required.`,
      }),
  }),
};

const changeCredentialsSchema = {
  body: Joi.object({
    email: emailValidation(),
  }),
};

const updateUserSchema = {
  body: Joi.object({
    username: stringValidation("Username", false),
    countryCode: stringValidation("Country code", false),
    phone: stringValidation("Phone", false),
    bio: stringValidation("Bio", false),
    yourIntellectualDisabilities: stringValidation(
      "Intellectual Disabilities",
      false
    ),
    interests: stringValidation("Interests", false),
    careTakerId: stringValidation("Care Takers", false),
    enableNotification: Joi.boolean().optional().messages({
      "boolean.base": "Enable Notification must be true or false",
    }),
    visibility: Joi.string()
      .valid(...Object.values(visibilityEnum))
      .optional()
      .messages({
        "any.required": "Visibility is required.",
        "string.empty": "Visibility cannot be empty.",
        "string.base": "Visibility must be a string.",
        "any.only": `Visibility must be one of: ${Object.values(
          visibilityEnum
        ).join(", ")}.`,
      }),
  }),
};

const resetPasswordSchema = {
  body: Joi.object({
    oldPassword: passwordValidation("Old Password"),
    password: passwordValidation(),
  }),
};

const searchCareTakerSchema = {
  query: Joi.object({
    careTakerCode: stringValidation("Care Taker Code"),
  }),
};

const getUserProfileSchema = {
  params: Joi.object({
    userId: ObjectIdValidation("UserID"),
  }),
};

export default {
  registerUserSchema,
  verifyOTPSchema,
  sendOTPSchema,
  completeRegistrationSchema,
  socialLoginSchema,
  loginSchema,
  changeCredentialsSchema,
  updateUserSchema,
  resetPasswordSchema,
  searchCareTakerSchema,
  getUserProfileSchema,
};
