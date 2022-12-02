import { Schema, model, Document, Types } from "mongoose";
import Job, { EJobType, EJobLevel, EJobWorkPlace, IAddress } from "@interfaces/job.interface";

const JobSchema: Schema = new Schema({
  userId: {
    type: Types.ObjectId,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(EJobType),
  },
  level: {
    type: String,
    required: true,
    enum: Object.values(EJobLevel),
  },
  workPlace: {
    type: String,
    required: true,
    enum: Object.values(EJobWorkPlace),
  },
  location: {
    default: {
      country: null,
      state: null,
      city: null,
    },
    type: Object as () => IAddress,
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
  isClosed: {
    type: Boolean,
    required: true,
    default: false,
  },
  createdAt: {
    type: Date,
    required: true,
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

const JobModel = model<Job & Document>("Jobs", JobSchema);

export default JobModel;
