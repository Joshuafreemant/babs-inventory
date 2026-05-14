// app/api/auth/change-status/route.ts
import { dbConnect } from "@/lib/db";
import { sendApprovedEmail } from "@/lib/utils";
import UserModel from "@/app/models/userModel";

const VALID_STATUSES = ["pending", "active", "suspended"] as const;
type Status = (typeof VALID_STATUSES)[number];

export async function POST(req: Request) {
  try {
    await dbConnect();
    const data = await req.json();
    const { id, status } = data ?? {};

    if (!id) {
      return Response.json({ error: "User ID is required." }, { status: 400 });
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      return Response.json(
        { error: `Status must be one of: ${VALID_STATUSES.join(", ")}.` },
        { status: 400 }
      );
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires");

    if (!updatedUser) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    // Notify the user if their account was just activated
    if (status === "active" && updatedUser.email) {
      sendApprovedEmail(updatedUser.email, updatedUser.firstname).catch((err) =>
        console.error("Approval email failed:", err)
      );
    }

    const allUsers = await UserModel.find().select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );

    return Response.json(
      { data: allUsers, message: "User status updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change status error:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}