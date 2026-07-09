import { type NextFunction, type Request, type Response } from "express";
import * as authService from "../services/auth.service.js";
import * as tokenService from "../services/token.service.js";
import { type TokenMeta } from "../services/token.service.js";

function getMeta(req: Request): TokenMeta {
  return { ip: req.ip, userAgent: req.headers["user-agent"] };
}

export async function signup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.signupUser(req.body, getMeta(req));
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.loginUser(req.body, getMeta(req));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function googleLogin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.loginWithGoogle(req.body, getMeta(req));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function verifyEmailOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.verifyEmailWithOtp(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmailLink(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.verifyEmailWithLink(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.resendVerification(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.requestPasswordReset(req.body);
    res.json({
      success: true,
      message: "If that email exists, a reset link has been sent",
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.resetPassword(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const result = await tokenService.rotateRefreshToken(
      req.body.refreshToken,
      getMeta(req),
    );
    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid refresh token";
    res.status(401).json({ error: message });
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await tokenService.revokeRefreshToken(req.body.refreshToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
