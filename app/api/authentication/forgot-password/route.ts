// app/api/auth/forgot-password/route.ts
import { dbConnect } from "@/lib/db";
import { sendResetEmail } from "@/lib/utils";
import UserModel from "@/app/models/userModel";
import { randomBytes } from "crypto";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { email, phone_number } = data ?? {};

    if (!email && !phone_number) {
      return Response.json(
        { error: "Please enter your email address or phone number." },
        { status: 400 }
      );
    }

    await dbConnect();

    let user: any = null;

    if (email) {
      user = await UserModel.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        // Return a vague message to prevent email enumeration
        return Response.json(
          { message: "If an account exists, reset instructions have been sent.", email: maskEmail(email) },
          { status: 200 }
        );
      }
    } else {
      user = await UserModel.findOne({ phone_number: phone_number.trim() });
      if (!user) {
        return Response.json(
          { message: "If an account exists, reset instructions have been sent.", email: "" },
          { status: 200 }
        );
      }
      if (!user.email) {
        return Response.json(
          { error: "No email address is associated with this account. Please contact support." },
          { status: 400 }
        );
      }
    }

    const resetToken = randomBytes(32).toString("hex"); // 32 bytes = stronger token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3_600_000; // 1 hour
    await user.save();

    await sendResetEmail(user.email, resetToken);

    return Response.json({
      message: "Reset instructions sent successfully.",
      email: maskEmail(user.email),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}