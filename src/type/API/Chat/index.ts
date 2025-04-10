export type SearchUsersRequest = {
  keyword: string;
};
export type BlockUserRequest = {
  chatId: string;
  blockUserId: string;
};

export type GetChatMessagesRequest = {
  chatId: string;
};
