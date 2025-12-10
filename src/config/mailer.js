// src/utils/mailer.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST,
  port: Number(process.env.MAILER_PORT) || 587,
  secure: process.env.MAILER_PORT === '465', // true for 465, false for 587
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS,
  },
  // optional: increase timeouts on Render
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
});
