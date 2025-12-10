import User from '../models/User.js';
import bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/* ----------------------- EMAIL TRANSPORTER (MAILERSEND) ----------------------- */

const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST,
  port: Number(process.env.MAILER_PORT),
  secure: false,
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS,
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

transporter.verify((err) => {
  if (err) {
    console.log("❌ Email transporter error:", err.message);
  } else {
    console.log("✅ Email transporter ready (MailerSend)");
  }
});

/* ---------------------------- 1️⃣ CHECK USER ---------------------------- */

export const checkUser = async (req, res) => {
  try {
    const { uniqueId } = req.body;
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isRegistered)
      return res.status(400).json({ message: 'User already registered' });

    res.json({ message: 'User found', email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* ---------------------------- 2️⃣ SEND OTP ---------------------------- */

export const sendOtp = async (req, res) => {
  try {
    const { uniqueId } = req.body;
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // MAIL VALIDATION
    if (!process.env.MAILER_USER || !process.env.MAILER_PASS) {
      return res.status(500).json({
        message: "Mail configuration missing",
        error: "MAILER_USER or MAILER_PASS not set"
      });
    }

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: user.email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    res.status(500).json({
      message: "Error sending OTP",
      error: err.message
    });
  }
};

/* ---------------------------- 3️⃣ VERIFY OTP ---------------------------- */

export const verifyOtp = async (req, res) => {
  try {
    const { uniqueId, otp } = req.body;
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpiry)
      return res.status(400).json({ message: 'OTP expired' });

    res.json({ message: 'OTP verified successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* ---------------------------- 4️⃣ SET PASSWORD ---------------------------- */

export const setPassword = async (req, res) => {
  try {
    const { uniqueId, password } = req.body;
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.isRegistered = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: 'Password created successfully, registration complete' });

  } catch (err) {
    res.status(500).json({ message: 'Error setting password', error: err.message });
  }
};

/* ---------------------------- 5️⃣ TEST EMAIL ---------------------------- */

export const testEmailConfig = async (req, res) => {
  try {
    await transporter.verify();

    res.json({
      message: "MailerSend configuration valid",
      email: process.env.MAIL_FROM,
      status: "ready"
    });

  } catch (err) {
    res.status(500).json({
      message: "Email configuration error",
      error: err.message,
    });
  }
};

/* ---------------------------- 6️⃣ LOGIN ---------------------------- */

export const loginUser = async (req, res) => {
  try {
    const { uniqueId, password } = req.body;
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign(
      { id: user.id, uniqueId: user.uniqueId },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        uniqueId: user.uniqueId,
        fullName: user.fullName,
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
