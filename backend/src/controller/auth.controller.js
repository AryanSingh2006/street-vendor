import userModel from "../model/user.model.js"
import bcrypt from "bcrypt";
import jwtUtil from "../utils/jwt.js";
import { NODE_ENV } from "../constants.js";
import ApiResponse from "../utils/APIResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

const signUp = asyncHandler(async (req, res) => {
  const { fullname, email, phone, password, role } = req.body;

  if (!fullname || !email || !phone || !password || !role) {
    throw new apiError(400, "All fields are required");
  }

  const existedUser = await userModel.findOne({ email });
  if (existedUser) {
    throw new apiError(400, "Email already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new userModel({
    fullname,
    email,
    phone,
    password: hashedPassword,
    role,
  });

  const savedUser = await newUser.save();

  const accessToken = jwtUtil.generateAccessToken({
    id: savedUser._id,
    email: savedUser.email,
    role: savedUser.role,
  });

  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const createdUser = await userModel.findById(savedUser._id).select("-password");

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "New user registered successfully."));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new apiError(400, "Email and password are required");
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    throw new apiError(400, "Invalid credentials");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new apiError(400, "Invalid credentials");
  }

  const accessToken = jwtUtil.generateAccessToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const createdUser = await userModel.findById(user._id).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "Login successful"));
});

const logout = (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json(new ApiResponse(200, null, "Logout successful"));
  } catch (error) {
    console.log("Error in logout controller", error.message);
    throw new apiError(500, "Internal Server Error");
  }
};


export default {
  signUp,
  login,
  logout
};