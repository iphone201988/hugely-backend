import { Schema, model } from "mongoose";
import { MatchesModel } from "../type/Database/types";

const matchesSchema = new Schema<MatchesModel>({
  match: [{ type: Schema.Types.ObjectId, ref: "user" }],
  lastMessage: { type: String },
  hasUnreadMessages: { type: Boolean, default: false },
});

const Matches = model<MatchesModel>("matches", matchesSchema);
export default Matches;
