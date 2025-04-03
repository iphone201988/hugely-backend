import { UserModel } from "./Database/types";

declare global {
  namespace Express {
    interface Request {
      user?: UserModel;
      userId: any;
    }
  }
}
