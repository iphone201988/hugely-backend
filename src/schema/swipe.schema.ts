import Joi, { object } from "joi";
import { ObjectIdValidation, numberValidation, stringValidation } from ".";

const swipeUsersSchema = {
  query: Joi.object({
    page: numberValidation("Page", false),
  }),
};

const getLikesSchema = {
  query: Joi.object({
    page: numberValidation("Page", false),
    likeSent: Joi.boolean().required().messages({
      "any.required": "LikeSent is required.",
      "boolean.base": "LikeSent must be a boolean.",
    }),
  }),
};

const sendLikeSchema = {
  body: Joi.object({
    likedUserId: ObjectIdValidation("Liked User ID"),
  }),
};
const rejectUserSchema = {
  body: Joi.object({
    rejectedUserId: ObjectIdValidation("Reject User ID"),
  }),
};
const searchUsersSchema = {
  query: Joi.object({
    search: stringValidation("Search"),
  }),
};

export default {
  swipeUsersSchema,
  getLikesSchema,
  sendLikeSchema,
  rejectUserSchema,
  searchUsersSchema
};
