import { Schema, model, Document } from 'mongoose';
import Job from '@interfaces/job.interface';

const JobSchema: Schema = new Schema({
  userId: {
    type: String,
  },
  emailUser: {
    type: String,
    require: true,
  },
  image: {
    type: String,
    require: true,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  category: [
    {
      type: String,
    },
  ],
  salary: String,
  created_at: String,
  deleted_at: String,
});

const JobModel = model<Job & Document>('Jobs', JobSchema);

export default JobModel;
