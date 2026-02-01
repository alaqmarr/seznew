"use server";

import { prisma } from "@/lib/db";
import { sendOTPEmail } from "@/lib/email";
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestOTP(email: string) {
  if (!email) return { success: false, error: "Email is required" };

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    await prisma.verificationCode.create({
      data: { email, code, expiresAt },
    });

    await sendOTPEmail(email, code);
    return { success: true };
  } catch (error) {
    console.error("OTP Error:", error);
    return { success: false, error: "Failed to send OTP" };
  }
}

export async function verifyOTP(email: string, code: string) {
  const record = await prisma.verificationCode.findFirst({
    where: { email, code, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { success: false, error: "Invalid or expired code" };

  return { success: true };
}

interface UpdateProfileParams {
  userId: string;
  name?: string;
  email?: string;
  password?: string;
  otpCode?: string;
  currentEmail?: string;
}

export async function updateUserProfile(params: UpdateProfileParams) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).id !== params.userId) {
    return { success: false, error: "Unauthorized" };
  }

  const { userId, name, email, password, otpCode } = params;
  const updateData: any = {};

  if (name) updateData.name = name;

  // Handle Sensitive Updates (Password or Email)
  if (password || (email && email !== (session.user as any).email)) {
    if (!otpCode) {
      return {
        success: false,
        error: "Verification code required for security updates",
      };
    }

    // If updating email, verify OTP sent to NEW email.
    // If updating only password, verify OTP sent to EXISTING email (or new if provided).
    const emailToVerify = email || (session.user as any).email;

    if (!emailToVerify) {
      return { success: false, error: "Email required for verification" };
    }

    const isValid = await verifyOTP(emailToVerify, otpCode);
    if (!isValid.success) {
      return { success: false, error: "Invalid verification code" };
    }

    if (password) {
      updateData.password = await hash(password, 12);
    }
    if (email) {
      updateData.email = email;
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    return { success: true };
  } catch (error) {
    console.error("Profile Update Error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
