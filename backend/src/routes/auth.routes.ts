import { Router } from "express";
import {
  forgotPassword,
  googleLogin,
  login,
  logout,
  refresh,
  resendVerification,
  resetPassword,
  signup,
  verifyEmailLink,
  verifyEmailOtp,
} from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailLinkSchema,
  verifyEmailOtpSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/signup", authRateLimiter, validateRequest(signupSchema), signup);
router.post("/login", authRateLimiter, validateRequest(loginSchema), login);
router.post(
  "/google",
  authRateLimiter,
  validateRequest(googleLoginSchema),
  googleLogin,
);
router.post(
  "/verify-email/otp",
  authRateLimiter,
  validateRequest(verifyEmailOtpSchema),
  verifyEmailOtp,
);
router.post(
  "/verify-email/link",
  authRateLimiter,
  validateRequest(verifyEmailLinkSchema),
  verifyEmailLink,
);
router.post(
  "/resend-verification",
  authRateLimiter,
  validateRequest(forgotPasswordSchema),
  resendVerification,
);
router.post(
  "/forgot-password",
  authRateLimiter,
  validateRequest(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/reset-password",
  authRateLimiter,
  validateRequest(resetPasswordSchema),
  resetPassword,
);
router.post("/refresh", validateRequest(refreshSchema), refresh);
router.post("/logout", validateRequest(refreshSchema), logout);

export default router;
