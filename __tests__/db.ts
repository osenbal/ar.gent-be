import mongoose from 'mongoose';
import { DbConfig } from '../src/databases/index';

export const connect = () => {
  mongoose.Promise = Promise;
  mongoose.connect(DbConfig.url);
};

export const disconnect = (done) => {
  mongoose.disconnect(done);
};
