import jwt from "jsonwebtoken";
import { JWT_ACCESS_EXPIRY, JWT_ACCESS_TOKEN } from "../constants.js";

const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_ACCESS_TOKEN, {expiresIn: JWT_ACCESS_EXPIRY});
}

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_TOKEN);
}

export default {
  generateAccessToken,
  verifyAccessToken
}