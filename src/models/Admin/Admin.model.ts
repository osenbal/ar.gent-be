import IAdmin from "@/interfaces/admin.interface";
import { model, Schema } from "mongoose";
import { CURRENT_URL } from "@/config/config";

const AdminSchema = new Schema<IAdmin>({
  avatar: {
    type: String,
    required: true,
    default: `${CURRENT_URL}public/defaults/profile/default_admin_avatar.jpeg`,
  },
  username: {
    type: String,
    required: true,
    unique: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
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

const AdminModel = model<IAdmin>("Admin", AdminSchema);

export default AdminModel;
