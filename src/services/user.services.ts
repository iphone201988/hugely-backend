import User from "../model/user.model";
import { UserModel } from "../type/Database/types";
import ErrorHandler from "../utils/ErrorHandler";

export const getUserById = async (userId: string): Promise<UserModel> => {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) throw new ErrorHandler("User not found", 400);

  return user;
};

export const getUserByEmail = async (
  email: string
): Promise<UserModel | null> => {
  const user = await User.findOne({
    email,
    isVerified: true,
    isDeleted: false,
  });
  if (!user) return null;
  return user;
};

export const getUserByPhone = async (
  countryCode: string,
  phone: string
): Promise<UserModel | null> => {
  const user = await User.findOne({
    countryCode,
    phone,
    isVerified: true,
    isDeleted: false,
  });
  if (!user) return null;
  return user;
};

export const generateUniqueCode = async () => {
  const maxAttempts = 100; // Limit attempts to prevent infinite loops
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const randomDigits = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");
    const careTakerCode = `HG-${randomDigits}`;

    try {
      const existingUser = await User.findOne({ where: { careTakerCode } });
      if (!existingUser) {
        return careTakerCode;
      }
    } catch (error) {
      console.error("Error checking code uniqueness:", error);
      throw error;
    }
  }
  throw new ErrorHandler(
    `Unable to generate unique code after ${maxAttempts} attempts`,
    500
  );
};
