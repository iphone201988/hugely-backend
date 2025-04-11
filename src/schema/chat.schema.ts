import Joi from "joi";
import { ObjectIdValidation, stringValidation } from ".";
import { messageTypeEnum } from "../utils/enums";

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

export default {
  searchUserSchema,
  blockUnblockUserSchema,
  getChatMessagesSchema,
  uploadMediaSchema,
};
