import express from "express"
import authMiddleware from "../middleware/auth.middleware.js";
import authController from "../controller/auth.controller.js";

const router = express.Router();

router.post('/signUp', authController.signUp);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);

export default router;