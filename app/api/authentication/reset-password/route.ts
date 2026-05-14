// app/api/auth/reset-password/route.ts
import { dbConnect } from "@/lib/db";
import UserModel from "@/app/models/userModel";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { password, resetToken } = data ?? {};

    if (!resetToken) {
      return Response.json({ error: "Reset token is required." }, { status: 400 });
    }
    if (!password) {
      return Response.json({ error: "Please enter a new password." }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await UserModel.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return Response.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    user.password = bcrypt.hashSync(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return Response.json({ message: "Password reset successfully." }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}