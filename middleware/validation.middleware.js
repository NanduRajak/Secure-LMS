import { body, param, query, validationResult } from "express-validator";

export const validate = (validations) => {
  return async (req, res, next) => {
    // run all validation
    await Promise.all(validations.map(validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedError = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
  };
};

export const commonValidations = {
  pagination: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .message("Page must be positve number"),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    message("Limit must be between 1 to 100"),
  ],
  email: body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  name: body("name")
    .trim()
    .isLength({ min: 8, max: 50 })
    .withMessage("Please provide a valid name"),
};

export const validateSignup = validate([
  commonValidations.email,
  commonValidations.name,
]);
