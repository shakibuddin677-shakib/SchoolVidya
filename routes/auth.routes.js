import express from "express";
import {
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  checkAuth,
} from "../controllers/auth.controller.js";
import isAuthenticated from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.get("/logout", logoutUser);

router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// Yeh route "isAuthenticated" middleware se PROTECTED hai - bina valid token ke yahan tak pahuchoge hi nahi
router.get("/check-auth", isAuthenticated, checkAuth);

export default router;
