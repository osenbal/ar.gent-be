import { config } from 'dotenv';

config({ path: '.env' });

export const { LOG_FORMAT, LOG_DIR } = process.env;

export const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = process.env;
