import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
const sendRefreshCookie = (res, token) => res.cookie("refreshToken", token, {
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, path: "/"
});
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: "All fields are required" });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: "Email already registered" });
  const user = await User.create({ name, email, password });
  const accessToken = generateAccessToken(user._id);
  sendRefreshCookie(res, generateRefreshToken(user._id));
  res.status(201).json({ user, accessToken });
});
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: "Invalid email or password" });
  sendRefreshCookie(res, generateRefreshToken(user._id));
  res.json({ user, accessToken: generateAccessToken(user._id) });
});
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    if (!(await User.exists({ _id: decoded.id }))) return res.status(401).json({ message: "User no longer exists" });
    res.json({ accessToken: generateAccessToken(decoded.id) });
  } catch { res.status(401).json({ message: "Invalid refresh token" }); }
});
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  res.json({ message: "Logged out" });
});
export const getMe = asyncHandler(async (req, res) => res.json(req.user));