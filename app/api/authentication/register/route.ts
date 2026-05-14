// app/api/auth/register/route.ts
import { dbConnect } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/utils";
// import { sendWelcomeEmail } from "@/lib/util";
import UserModel from "@/app/models/userModel";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { firstname, lastname, email, phone_number, password, role } = data ?? {};

    // Validate required fields before hitting the DB
    if (!firstname?.trim()) {
      return Response.json({ error: "First name is required." }, { status: 400 });
    }
    if (!lastname?.trim()) {
      return Response.json({ error: "Last name is required." }, { status: 400 });
    }
    if (!email?.trim()) {
      return Response.json({ error: "Email address is required." }, { status: 400 });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await UserModel.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    // Use salt rounds of 10 (5 is too low — brute-force risk)
    const hash = bcrypt.hashSync(password, 10);

    const user = await UserModel.create({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: email.toLowerCase().trim(),
      phone_number: phone_number?.trim() ?? "",
      role: role ?? "staff",
      status: "pending", // always start as pending; admin approves
      password: hash,
    });

    // Fire-and-forget — don't block the response on email delivery
    sendWelcomeEmail(user.email, user.firstname).catch((err) =>
      console.error("Welcome email failed:", err)
    );

    const { password: _pw, ...userInfo } = user.toObject();
    return Response.json(
      { data: userInfo, message: "Account created successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}