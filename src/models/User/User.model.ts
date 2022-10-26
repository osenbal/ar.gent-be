import IUser, { EGender, IAddress, IExperience, IEducation, ICertificate } from "@interfaces/user.interface";
import { model, Schema } from "mongoose";
import { ROLE_USER } from "@config/constant/constant";
import { CURRENT_URL } from "@/config/config";

const UserSchema = new Schema<IUser>({
  banner: {
    type: String,
    default: `${CURRENT_URL}public/defaults/profile/default_banner.jpg`,
  },
  avatar: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  about: {
    type: String,
    default: "Hi there! I am using ar.gent.",
  },
  birthday: {
    type: Date,
    required: true,
  },
  address: {
    default: {
      street: "",
      city: "",
      country: "",
    },
    type: Object as () => IAddress,
    required: true,
  },
  gender: {
    type: String,
    enum: Object.values(EGender),
    required: true,
  },
  role: {
    type: String,
    default: ROLE_USER,
  },
  cv: {
    type: String,
    default: "",
  },
  skill: {
    type: [String],
    default: [],
  },
  education: {
    type: [Object as () => IEducation],
    default: [],
  },
  experience: {
    type: [Object as () => IExperience],
    default: [],
  },
  certificate: {
    type: [Object as () => ICertificate],
    default: [],
  },
  portfolio_url: {
    type: [String],
    default: [],
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  updatedAt: {
    type: Date,
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

const UserModel = model<IUser>("User", UserSchema);

export default UserModel;
