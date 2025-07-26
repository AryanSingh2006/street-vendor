import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/street-vendor";
export const JWT_ACCESS_TOKEN = process.env.JWT_ACCESS_TOKEN || "your-secret-key";
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "7d";
export const NODE_ENV = process.env.NODE_ENV || "development";