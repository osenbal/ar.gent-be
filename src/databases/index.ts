import {
  DB_DATABASE,
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
} from '@config/database.config';

export const dbConnection = {
  url: `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@argent.ufb0iq2.mongodb.net/?retryWrites=true&w=majority`,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};
