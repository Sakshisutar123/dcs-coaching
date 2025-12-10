import User from '../models/User.js';
import bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator';
import dotenv from 'dotenv';
dotenv.config();

/* ----------------------- MAILERSEND (API EMAIL) ----------------------- */
import { MailerSend, EmailParams, Sender } from "mailersend";

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const sentFrom = new Sender(
  process.env.MAIL_FROM,
  process.env.MAIL_FROM_NAME || "DCS Coaching"
);

async function sendEmail(to, subject, html) {
  try {
    // Validate email configuration
    if (!process.env.MAILERSEND_API_KEY) {
      console.error("❌ MAILERSEND_API_KEY not set");
      return false;
    }
    
    if (!process.env.MAIL_FROM) {
      console.error("❌ MAIL_FROM not set");
      return false;
    }
    
    if (!to || !to.includes('@')) {
      console.error("❌ Invalid recipient email:", to);
      return false;
    }

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo([{ email: to }])
      .setSubject(subject)
      .setHtml(html);

    await mailerSend.email.send(emailParams);
    console.log("📧 MailerSend email sent to:", to);
    return true;
  } catch (err) {
    console.error("❌ MailerSend error:", err.message);
    console.error("❌ Error details:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      to: to,
      from: process.env.MAIL_FROM
    });
    return false;
  }
}

/* ---------------------------- 1️⃣ CHECK USER ---------------------------- */
export const checkUser = async (req, res) => {
  try {
    const { uniqueId } = req.body;
    
    // Check if table exists first
    const tableExists = await User.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )`,
      { type: User.sequelize.QueryTypes.SELECT }
    );
    
    if (!tableExists[0]?.exists) {
      return res.status(500).json({ 
        message: 'Database table missing', 
        error: 'Users table does not exist. Please run migrations or create the table.',
        hint: 'Run: CREATE TABLE users (...) or set SYNC_DB=true in environment variables'
      });
    }
    
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) {
      // Check if any users exist
      const userCount = await User.count();
      return res.status(404).json({ 
        message: 'User not found',
        debug: {
          searchedUniqueId: uniqueId,
          totalUsersInDatabase: userCount,
          hint: userCount === 0 ? 'No users in database. Add a user first.' : `User with uniqueId "${uniqueId}" does not exist.`
        }
      });
    }
    
    if (user.isRegistered)
      return res.status(400).json({ message: 'User already registered' });

    res.json({ message: 'User found', email: user.email });
  } catch (err) {
    console.error('Check user error:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  }
};

/* ---------------------------- 2️⃣ SEND OTP ---------------------------- */
export const sendOtp = async (req, res) => {
  try {
    const { uniqueId } = req.body;
    
    if (!uniqueId) {
      return res.status(400).json({ message: 'uniqueId is required' });
    }
    
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has email
    if (!user.email) {
      return res.status(400).json({ 
        message: 'User email not found',
        error: 'User does not have an email address configured'
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    console.log(`📤 Attempting to send OTP to: ${user.email}`);

    const emailSent = await sendEmail(
      user.email,
      "OTP Verification",
      `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
    );

    if (!emailSent) {
      // Check environment variables
      const envCheck = {
        MAILERSEND_API_KEY: process.env.MAILERSEND_API_KEY ? '✅ Set' : '❌ Missing',
        MAIL_FROM: process.env.MAIL_FROM || '❌ Missing',
        MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Not set (optional)',
        userEmail: user.email || '❌ Missing'
      };

      return res.status(500).json({
        message: "Failed to send OTP",
        error: "MailerSend API error",
        debug: envCheck,
        hint: "Check server logs for detailed error message"
      });
    }

    res.json({ 
      message: "OTP sent successfully",
      email: user.email 
    });

  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({
      message: "Error sending OTP",
      error: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
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

/* ---------------------------- 5️⃣ TEST EMAIL CONFIG ---------------------------- */
export const testEmailConfig = async (req, res) => {
  try {
    const config = {
      MAILERSEND_API_KEY: process.env.MAILERSEND_API_KEY ? '✅ Set' : '❌ Missing',
      MAIL_FROM: process.env.MAIL_FROM || '❌ Missing',
      MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Not set (optional)',
    };

    if (!process.env.MAILERSEND_API_KEY) {
      return res.status(400).json({
        message: "MailerSend configuration incomplete",
        config: config,
        error: "MAILERSEND_API_KEY is required",
        hint: "Add MAILERSEND_API_KEY to Render environment variables"
      });
    }

    if (!process.env.MAIL_FROM) {
      return res.status(400).json({
        message: "MailerSend configuration incomplete",
        config: config,
        error: "MAIL_FROM is required",
        hint: "Add MAIL_FROM to Render environment variables (e.g., noreply@yourdomain.com)"
      });
    }

    const test = await sendEmail(
      process.env.MAIL_FROM,
      "MailerSend Test Email",
      "<p>Your MailerSend integration works!</p>"
    );

    if (!test) {
      return res.status(500).json({
        message: "MailerSend test failed",
        config: config,
        hint: "Check server logs for detailed error message"
      });
    }

    res.json({
      message: "MailerSend configuration valid",
      config: config,
      status: "ready",
    });

  } catch (err) {
    console.error('Test email config error:', err);
    res.status(500).json({
      message: "Email config error",
      error: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
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
