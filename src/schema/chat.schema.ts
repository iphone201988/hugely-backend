import Joi from "joi";
import { ObjectIdValidation, stringValidation } from ".";
import { reportTypeEnum } from "../utils/enums";

const searchUserSchema = {
  query: Joi.object({
    keyword: stringValidation("Search keyword"),
  }),
};

const blockUnblockUserSchema = {
  query: Joi.object({
    chatId: ObjectIdValidation("Chat ID"),
    blockUserId: ObjectIdValidation("Blocked User ID"),
  }),
};

const getChatMessagesSchema = {
  params: Joi.object({
    chatId: ObjectIdValidation("Chat ID"),
  }),
};

const uploadMediaSchema = {
  body: Joi.object({
    chatId: ObjectIdValidation("Chat ID"),
  }),
};

const reportUserSchema = {
  body: Joi.object({
    chatId: ObjectIdValidation("Chat Id"),
    reportedUserId: ObjectIdValidation("Report User Id"),
    description: stringValidation("Description"),
    type: Joi.number()
      .valid(...Object.values(reportTypeEnum))
      .required()
      .messages({
        "number.base": `Report Type must be a number.`,
        "any.only": `Report Type must be one of: ${Object.values(
          reportTypeEnum
        ).join(", ")}.`,
        "any.required": `Report Type is required.`,
      }),
  }),
};

export default {
  searchUserSchema,
  blockUnblockUserSchema,
  getChatMessagesSchema,
  uploadMediaSchema,
  reportUserSchema
};
