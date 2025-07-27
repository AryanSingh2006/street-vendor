import jwt from "jsonwebtoken";
import UserModel from "../model/user.model.js";

export const isVendor = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({
        message: "Access denied. Please login first.",
        error: "No token provided"
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "Access denied. User not found.",
        error: "Invalid token"
      });
    }

    if (user.role !== 'vendor') {
      return res.status(403).json({
        message: "Access denied. Vendor access required.",
        error: "Insufficient permissions"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Access denied. Invalid token.",
      error: error.message
    });
  }
};
