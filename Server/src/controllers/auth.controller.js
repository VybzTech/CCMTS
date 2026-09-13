import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import { validateFields, sendValidationError } from "../utils/validate.js";
import {
  checkLoginAllowed,
  recordFailedLogin,
  clearLoginAttempts,
} from "../services/loginThrottle.js";

export const login = async (req, res) => {
  logger.info(`Login attempted for email: ${req.body.email}`);

  try {
    const { email, password } = req.body;

    // Must come first. findFirst({ where: { email: undefined } }) is not
    // "no match" - Prisma drops the undefined filter and returns the
    // FIRST USER IN THE TABLE, which then had a password compared
    // against it. An empty email was an auth bug, not just a 500
    // (UAT AUTH-004/005/006).
    const invalid = validateFields(req.body, [
      { key: "email", label: "Email address", type: "email" },
      { key: "password", label: "Password" },
    ]);
    if (invalid.message) return sendValidationError(res, invalid);

    // Checked before the credential lookup so a locked account costs no
    // DB work and leaks no timing signal (UAT AUTH-007).
    const throttle = await checkLoginAllowed(req, email);
    if (throttle.locked) {
      logger.warn(`Login blocked by throttle for email: ${email}`);
      return res
        .status(429)
        .set("Retry-After", String(throttle.retryAfterSeconds))
        .json({ message: throttle.message });
    }

    const existing_user = await prisma.user.findFirst({
      where: { email: email },
      include: {
        directorate: true,
      },
    });

    const isPasswordCorrect = existing_user
      ? await bcrypt.compare(password, existing_user.password)
      : false;

    if (!existing_user || !isPasswordCorrect) {
      // The warning ("2 attempts remaining...") is appended to the same
      // generic message rather than replacing it - the user still must
      // not learn whether the email exists.
      const { warning } = await recordFailedLogin(req, email);
      return res.status(401).json({
        message: warning
          ? `Invalid email or password. ${warning}`
          : "Invalid email or password",
      });
    }

    // Credentials were right, so this is not a brute-force run - clear the
    // counter even if the disabled check below still refuses the session.
    await clearLoginAttempts(req, email);

    if (existing_user.disabled) {
      return res.status(403).json({
        message: "This account has been disabled",
      });
    }

    const token = jwt.sign(
      {
        id: existing_user.id.toString(),
        email: existing_user.email,
        name: existing_user.name,
        role: existing_user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      },
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      id: existing_user.id.toString(),
      email: existing_user.email,
      name: existing_user.name,
      role: existing_user.role,
      directorate: existing_user.directorate
        ? {
          ...existing_user.directorate,
          id: existing_user.directorate.id.toString(),
        }
        : null,
      access_token: token,
      mustResetPassword: existing_user.mustResetPassword,
    });
  } catch (err) {
    logger.error("Login internal error:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const user = async (req, res) => {
  if (req.user) {
    return res.status(200).json({
      user: req.user,
    });
  } else {
    return res.status(401).json({
      message: "Not Logged In",
    });
  }
};

// Not in API_DOCUMENTATION.md - used by the client's ForcePasswordResetPage
// after a Management user resets an account to the shared default password.
export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    // Same 400 shape as every other handler now, so the client can read
    // `errors.newPassword` for per-field placement instead of only the
    // flat message this used to return.
    const invalid = validateFields(req.body, [
      { key: "newPassword", label: "New password", minLength: 8 },
    ]);
    if (invalid.message) return sendValidationError(res, invalid);

    const hashed_password = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: BigInt(req.user.id) },
      data: { password: hashed_password, mustResetPassword: false },
    });

    return res.status(200).json({ message: "Password updated" });
  } catch (err) {
    logger.error("Change Password Error:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
