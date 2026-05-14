import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import nodemailer from "nodemailer";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
const FROM = `"PHARMA TRACKER" <tolexjoshua@gmail.com>`;
const sendWelcomeEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: FROM,
    to: email,
    subject: "Welcome to PHARMA-TRACKER!",
    text: `Dear ${name},\n\n🎉 Welcome to PHARMA-TRACKER! 🎉\nYour account approval is underway. Once approved, access your financial records and more!\n\nThe PHARMA-TRACKER Team 🚀`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", info.response);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};

const sendResetEmail = async (email: string, resetToken: string) => {
  const mailOptions = {
    from: FROM,
    to: email,
    subject: "Password Reset",
    text: `Click the following link to reset your password:\n\nhttps://pharma-tracker-five.vercel.app/reset-password?token=${resetToken}\n\nThis link expires in 1 hour.\n\nIf you did not request a password reset, please ignore this email.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Reset email sent:", info.response);
  } catch (error) {
    console.error("Error sending reset email:", error);
    throw error; // re-throw so the API route can catch it
  }
};

const sendApprovedEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: FROM,
    to: email,
    subject: "PHARMA-TRACKER Membership Approved!",
    text: `Dear ${name},\n\n🎉 Congratulations! Your account has been approved! 🎉\n\nYou can now log in to access your financial records and enjoy all the features of PHARMA-TRACKER.\n\nWelcome aboard!\n\nThe PHARMA-TRACKER Team 🚀`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Approved email sent:", info.response);
  } catch (error) {
    console.error("Error sending approved email:", error);
  }
};

const sendNotificationEmail = async (email: string, name: string, text: string) => {
  const mailOptions = {
    from: FROM,
    to: email,
    subject: "KOL New Payment Record!",
    text: `Dear ${name},\n\n${text} your dashboard 🎉.\n\nLogin here to view your records.\n\nThe KOL Cooperative Society Team 🚀`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Notification email sent:", info.response);
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
};

export { sendWelcomeEmail, sendApprovedEmail, sendNotificationEmail, sendResetEmail };