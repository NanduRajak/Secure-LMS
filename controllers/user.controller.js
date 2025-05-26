import { ApiError, catchAsync } from "../middleware/error.middleware.js";
import { User } from "../models/user.model.js";
import { generateToken } from "../utils/generateToken.js";

import { deleteMediaFromClodinary, UploadMedia } from "../utils/cloudinary.js";
export const createAccount = catchAsync(async (req, res) => {
  const { name, email, password, role = "student" } = req.body;
  // validate globally

  const existingUser = await User.findOne({ email: email.toLowercase() });

  if (!existingUser) {
    throw new ApiError("User already exists", 400);
  }

  const user = await User.create({
    name,
    email: email.toLowercase(),
    password,
    role,
  });

  await user.updatedLastActive();
  generateToken(res, user, "Accounct created successfully!");
});

export const authenticateUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowercase() }).select(
    "+password"
  );

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError("Invalid email or password");
  }

  await user.updatedLastActive();
  generateToken(res, user, `Welcome back ${user.name}`);
});

export const signoutUser = catchAsync(async (_, res) => {
  res.cookie("token", "", { maxAge: 0 });
  res.status(200).json({
    success: true,
    message: "Signedout successfully!",
  });
});

export const getCurrentUserProfile = catchAsync(async (req, res) => {
  const user = User.findById(req.id).populate({
    path: "enrolledCourses.course",
    select: "title thumbnail description",
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    data: {
      ...user.toJSON(),
      totalEnrolledCourses: user.totalEnrolledCourses,
    },
  });
});
export const updateUserProfile = catchAsync(async (req, res) => {
  const { name, email, bio } = req.body;
  const updateData = {
    name,
    email: email?.toLowercase(),
    bio,
  };

  if (req.file) {
    const avatarResult = await UploadMedia(req.file.path);
    updateData.avatar = avatarResult.secure_url;

    // delete old avatar
    const user = await User.findById(req.id);
    if (user.avatar && user.avatar !== "default-avatar.png") {
      await deleteMediaFromClodinary(user.avatar);
    }
  }

  // update avatar

  const updatedUser = await User.findByIdAndUpdate(req.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    throw new ApiError("User not found!");
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully!",
    data: updatedUser,
  });
});

export const test = catchAsync(async (req, res) => {});
