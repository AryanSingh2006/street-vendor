import jwtUtil from "../utils/jwt.js";

const authMiddleware = (req, res, next) => {
  try {
    // Check if cookies exist
    if (!req.cookies) {
      return res.status(401).json({
        success: false,
        message: "No cookies found"
      });
    }

    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token found"
      });
    }

    const decoded = jwtUtil.verifyAccessToken(token);
    req.user = decoded;
    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      error: err.message
    });
  }
}

export default authMiddleware;