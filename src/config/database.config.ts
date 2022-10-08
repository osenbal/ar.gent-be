import { config } from "dotenv";

config({ path: ".env" });

export const { DB_HOST, DB_PORT, DB_DATABASE } = process.env;
