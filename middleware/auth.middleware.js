import jwt from "jsonwebtoken";
import { ApiError, catchAsync } from "./error.middleware";

export const isAuthed = catchAsync(async (req, res, next) => {
  const token = req.cookie.token;

  if (!token) {
    throw new ApiError("You are not loggedin");
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.id = decoded.userId;
    next();
  } catch (error) {
    throw new ApiError("JWT token error", 401);
  }
});
