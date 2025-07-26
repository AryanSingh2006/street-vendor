import userModel from "../model/user.model.js"
import bcrypt from "bcrypt";
import jwtUtil from "../utils/jwt.js";
import { NODE_ENV } from "../constants.js";

const signUp = async (req, res) => {
  const { fullname, email, phone, password, role } = req.body;
  try {

    if (!fullname || !email || !phone || !password || !role) {
      return res.status(400).json({
        message: "All fields are required"
      })
    }

    const existedUser = await userModel.findOne({ email });
    if (existedUser) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      fullname,
      email,
      phone,
      password: hashedPassword,
      role
    });

    const savedUser = await newUser.save();

    if (savedUser) {
      const accessToken = jwtUtil.generateAccessToken({ 
        id: savedUser._id, 
        email: savedUser.email,
        role: savedUser.role
      });
      
      res.cookie("token", accessToken, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        message: "New user has successfully registered",
        user: {
          id: savedUser._id,
          fullname: savedUser.fullname,
          email: savedUser.email,
          phone: savedUser.phone,
          role: savedUser.role
        }
      });
    }

  } catch (error) {
    console.error("Error in signUp:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
}
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = jwtUtil.generateAccessToken({ 
      id: user._id, 
      email: user.email,
      role: user.role
    });

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
}
const logout = (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({
      message: "Logout successful"
    });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
}

export default { 
  signUp,
  login,
  logout
 };