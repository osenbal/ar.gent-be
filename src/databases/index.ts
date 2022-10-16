import mongoose, { ConnectOptions } from 'mongoose';
import {
  DB_DATABASE,
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
} from '@config/database.config';

export const DbConfig = {
  url: `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@argent.ufb0iq2.mongodb.net/${DB_DATABASE}?retryWrites=true&w=majority`,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

export class Database {
  private static _database: Database;
  private constructor() {
    const dbUrl = DbConfig.url;
    if (dbUrl) {
      mongoose
        .connect(dbUrl, DbConfig.options as ConnectOptions)
        .then(() => console.log('Connected with database'))
        .catch(() => console.log('Not connected with database'));
    }
  }
  static getInstance() {
    if (this._database) {
      return this._database;
    }
    this._database = new Database();
    return (this._database = new Database());
  }
}
