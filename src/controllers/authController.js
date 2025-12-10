import User from '../models/User.js';
import bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator';
import dotenv from 'dotenv';
dotenv.config();

/* ----------------------- BREVO (API EMAIL) ----------------------- */
import brevo from '@getbrevo/brevo';

const apiInstance = new brevo.TransactionalEmailsApi();
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
}

// Validate email configuration on startup
if (process.env.MAIL_FROM && !process.env.MAIL_FROM.includes('@')) {
  console.error("⚠️  WARNING: MAIL_FROM should be an email address, not a name!");
  console.error("⚠️  Current value:", process.env.MAIL_FROM);
  console.error("⚠️  Example: MAIL_FROM=noreply@yourdomain.com");
}

if (!process.env.BREVO_API_KEY) {
  console.warn("⚠️  WARNING: BREVO_API_KEY not set. Email sending will fail.");
}

async function sendEmail(to, subject, html) {
  try {
    // Validate email configuration
    if (!process.env.BREVO_API_KEY) {
      console.error("❌ BREVO_API_KEY not set");
      return false;
    }
    
    if (!process.env.MAIL_FROM) {
      console.error("❌ MAIL_FROM not set");
      return false;
    }
    
    // Validate MAIL_FROM is an email, not a name
    if (!process.env.MAIL_FROM.includes('@')) {
      console.error("❌ MAIL_FROM must be an email address, not a name:", process.env.MAIL_FROM);
      return false;
    }
    
    if (!to || !to.includes('@')) {
      console.error("❌ Invalid recipient email:", to);
      return false;
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = {
      name: process.env.MAIL_FROM_NAME || "DCS Coaching",
      email: process.env.MAIL_FROM
    };
    sendSmtpEmail.to = [{ email: to }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("📧 Brevo email sent to:", to);
    return true;
  } catch (err) {
    // Better error logging for Brevo
    const errorDetails = {
      message: err.message || 'Unknown error',
      name: err.name,
      status: err.response?.status || err.statusCode,
      statusText: err.response?.statusText,
      body: err.response?.body || err.body,
      text: err.response?.text,
      to: to,
      from: process.env.MAIL_FROM,
      fromName: process.env.MAIL_FROM_NAME
    };
    
    console.error("❌ Brevo error:", JSON.stringify(errorDetails, null, 2));
    console.error("❌ Full error object:", err);
    
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
        BREVO_API_KEY: process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing',
        MAIL_FROM: process.env.MAIL_FROM || '❌ Missing',
        MAIL_FROM_IS_EMAIL: process.env.MAIL_FROM?.includes('@') ? '✅ Valid' : '❌ Invalid (must be email address)',
        MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Not set (optional)',
        userEmail: user.email || '❌ Missing'
      };

      return res.status(500).json({
        message: "Failed to send OTP",
        error: "Brevo API error",
        debug: envCheck,
        hint: process.env.MAIL_FROM && !process.env.MAIL_FROM.includes('@') 
          ? "MAIL_FROM must be an email address (e.g., noreply@yourdomain.com), not a name"
          : "Check server logs for detailed error message"
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
      BREVO_API_KEY: process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing',
      MAIL_FROM: process.env.MAIL_FROM || '❌ Missing',
      MAIL_FROM_IS_EMAIL: process.env.MAIL_FROM?.includes('@') ? '✅ Valid' : '❌ Invalid',
      MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Not set (optional)',
    };

    if (!process.env.BREVO_API_KEY) {
      return res.status(400).json({
        message: "Brevo configuration incomplete",
        config: config,
        error: "BREVO_API_KEY is required",
        hint: "Add BREVO_API_KEY to Render environment variables"
      });
    }

    if (!process.env.MAIL_FROM) {
      return res.status(400).json({
        message: "Brevo configuration incomplete",
        config: config,
        error: "MAIL_FROM is required",
        hint: "Add MAIL_FROM to Render environment variables (e.g., noreply@yourdomain.com)"
      });
    }

    if (!process.env.MAIL_FROM.includes('@')) {
      return res.status(400).json({
        message: "Brevo configuration invalid",
        config: config,
        error: "MAIL_FROM must be an email address",
        hint: "Change MAIL_FROM to an email address (e.g., noreply@yourdomain.com)"
      });
    }

    const test = await sendEmail(
      process.env.MAIL_FROM,
      "Brevo Test Email",
      "<p>Your Brevo integration works!</p>"
    );

    if (!test) {
      return res.status(500).json({
        message: "Brevo test failed",
        config: config,
        hint: "Check server logs for detailed error message"
      });
    }

    res.json({
      message: "Brevo configuration valid",
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
