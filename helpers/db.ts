import mongoose from "mongoose";
import { DbConfig } from "../src/databases/index";

export const connect = () => {
  mongoose.Promise = Promise;
  mongoose.connect(DbConfig.url);
};

export const clear = () => {
  return mongoose.connection.db.dropDatabase();
};

export const disconnect = () => {
  mongoose.disconnect();
};
