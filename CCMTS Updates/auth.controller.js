import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password, role, directorateId } = req.body;

    const hashed_password = await bcrypt.hash(password, 10);

    const new_user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed_password,
        role: role || "ODU",
        directorateId: directorateId ? BigInt(directorateId) : null,
      },
    });

    if (role === "Courier") {
      await prisma.courier.create({
        data: {
          userId: new_user.id,
          name: new_user.name,
          email: new_user.email,
          baseLga: req.body.base_lga || "IKEJA",
        },
      });
    }

    const token = jwt.sign(
      {
        id: new_user.id.toString(),
        email: new_user.email,
        name: new_user.name,
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

    return res.status(201).json({
      message: "User Created",
      user: {
        id: new_user.id.toString(),
        name: new_user.name,
        email: new_user.email,
        role: new_user.role,
      },
    });
  } catch (err) {
    logger.error("Signup error:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const login = async (req, res) => {
  logger.info(`Login attempted for email: ${req.body.email}`);

  try {
    const { email, password } = req.body;

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
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

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

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

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
