import express from "express";
import {
  authenticateUser,
  createAccount,
  getCurrentUserProfile,
  signoutUser,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { isAthenticated } from "../middleware/auth.middleware.js";
import upload, { updateUserProfile } from "../utils/multer.js";
import { validateSignup } from "../middleware/validation.middleware.js";

const router = express.Router();

// Auth routes
router.post("/signup", validateSignup, createAccount);
router.post("/signin", authenticateUser);
router.post("/signout", signoutUser);

// profile routes
router.get("/profile", isAthenticated, getCurrentUserProfile);
router.patch(
  "/profile",
  isAthenticated,
  upload.single("avatar"),
  updateUserProfile
);

export default router;
