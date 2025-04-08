export type RegisterUserRequest = {
  username: string;
  role: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  longitude: number;
  latitude: number;
  deviceToken: string;
  deviceType: number;
};

export type VerifyOtpRequest = {
  userId: string;
  otp: number;
  type: number;
};

export type SendOtpRequest = {
  email: string;
  type: number;
};

export type CompleteRegistrationRequest = {
  userId: string;
  relationship: string;
  country: string;
  gender: string;
  dob: string;
  yourIntellectualDisabilities: string;
  interests: string;
  drink: string;
  likeToDate: string;
  partnerIntellectualDisabilities: string;
  ageGroup: string;
  bio: string;
  careTakerId: string;
};

export type ChangePasswordRequest = {
  userId: string;
  password: string;
};

export type LoginUserRequest = {
  username: string;
  password: string;
  deviceToken: string;
  deviceType: number;
  latitude: number;
  longitude: number;
};

export type SocilLoginRequest = {
  socialId: string;
  email: string;
  username: string;
  profileImage: string;
  socialType: number;
  deviceToken: string;
  deviceType: number;
  latitude: number;
  longitude: number;
};
