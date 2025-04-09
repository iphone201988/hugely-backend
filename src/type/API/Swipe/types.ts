import { boolean } from "joi";

export type SwipeUsersRequest = {
  page: number;
};

export type GetLikesRequest = {
  page: number;
  likeSent: boolean;
};
