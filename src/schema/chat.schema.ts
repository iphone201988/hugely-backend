import Joi from "joi";
import { ObjectIdValidation, stringValidation } from ".";

const searchUserSchema = {
  query: Joi.object({
    keyword: stringValidation("Search keyword"),
  }),
};

const blockUserSchema = {
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

export default { searchUserSchema, blockUserSchema, getChatMessagesSchema };
