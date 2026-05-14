// app/api/auth/login/route.ts
import { dbConnect } from "@/lib/db";
import UserModel from "@/app/models/userModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { email, phone_number, password } = data ?? {};

    if (!password) {
      return Response.json({ error: "Password is required." }, { status: 400 });
    }
    if (!email && !phone_number) {
      return Response.json(
        { error: "Please provide an email address or phone number." },
        { status: 400 }
      );
    }

    await dbConnect();

    let user: any = null;

    if (email) {
      user = await UserModel.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return Response.json(
          { error: "No account found with that email address." },
          { status: 404 }
        );
      }
    } else {
      user = await UserModel.findOne({ phone_number: phone_number.trim() });
      if (!user) {
        return Response.json(
          { error: "No account found with that phone number." },
          { status: 404 }
        );
      }
    }

    // Check account status before allowing login
    if (user.status === "suspended") {
      return Response.json(
        { error: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }
    if (user.status === "pending") {
      return Response.json(
        { error: "Your account is pending approval. Please wait for an admin to activate it." },
        { status: 403 }
      );
    }

    // NOTE: passwords should NOT be lowercased before comparison.
    // Only hash what users actually type. If existing passwords were
    // hashed with .toLowerCase(), keep this line as-is and migrate later.
    const isCorrect = bcrypt.compareSync(password, user.password);
    if (!isCorrect) {
      return Response.json({ error: "Incorrect password." }, { status: 401 });
    }

    if (!process.env.JWT_KEY) {
      console.error("JWT_KEY environment variable is not set.");
      return Response.json({ error: "Server configuration error." }, { status: 500 });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "7d" }
    );

    const { password: _pw, resetPasswordToken: _rt, resetPasswordExpires: _re, ...info } = user._doc;
    return Response.json({ ...info, token }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}