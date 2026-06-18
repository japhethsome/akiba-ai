"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/session";
import crypto from "crypto";
import { getSafeErrorMessage } from "@/lib/error";
import { sendEmail } from "@/lib/email";

export async function registerOwner(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const isGoogleRegister = formData.get("isGoogleRegister") === "true";
  let password = formData.get("password") as string;
  const storeName = formData.get("storeName") as string;

  if (isGoogleRegister) {
    password = crypto.randomBytes(32).toString("hex");
  }

  if (!name || !email || !phone || !password || !storeName) {
    return { error: "All fields are required" };
  }

  try {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return { error: "This email address is already registered. Please log in or use a different email." };
    }

    // Check if phone number already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      return { error: "This phone number is already registered. Please use a different phone number." };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Store and User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newStore = await tx.store.create({
        data: {
          name: storeName,
        },
      });

      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password_hash: hashedPassword,
          role: "owner",
          store_id: newStore.id,
        },
      });
      return { user: newUser, store: newStore };
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    await setSession(result.user.user_id, result.user.role, result.store.id);

    return { success: true, user: result.user };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { success: false, error: getSafeErrorMessage(error, "An unexpected error occurred during registration. Please try again.") };
  }
}

export async function registerAttendant(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const isGoogleRegister = formData.get("isGoogleRegister") === "true";
    let password = formData.get("password") as string;
    const inviteToken = formData.get("inviteToken") as string;

    if (isGoogleRegister) {
      password = crypto.randomBytes(32).toString("hex");
    }

    if (!inviteToken) throw new Error("Missing invitation token.");

    const invitation = await prisma.invitation.findUnique({
      where: { token: inviteToken },
    });

    if (!invitation || invitation.used || invitation.expires_at < new Date()) {
      throw new Error("Invalid or expired invitation.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password_hash: hashedPassword,
        role: "attendant",
        store_id: invitation.store_id,
      },
    });

    // Mark invitation as used
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { used: true },
    });

    await setSession(user.user_id, user.role, user.store_id);

    return { success: true };
  } catch (error: any) {
    console.error("Attendant registration error:", error);
    return { success: false, error: getSafeErrorMessage(error, "An unexpected error occurred during attendant registration. Please try again.") };
  }
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    // Check superadmin table first
    const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
    if (superAdmin) {
      if (!superAdmin.is_active) return { error: "This admin account has been deactivated." };
      const passwordMatch = await bcrypt.compare(password, superAdmin.password_hash);
      if (!passwordMatch) return { error: "Incorrect password. Please try again." };

      // Update last login
      await prisma.superAdmin.update({
        where: { id: superAdmin.id },
        data: { last_login: new Date() }
      });

      await setSession(superAdmin.id, "superadmin", null);
      return { success: true, user: { id: superAdmin.id, name: superAdmin.name, role: "superadmin", store: null } };
    }

    // Fall through to normal user lookup
    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: true },
    });

    if (!user) {
      return { error: "No account found with this email address. Please register first." };
    }

    if (!user.is_active) {
      return { error: "This account has been locked. Please contact support." };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return { error: "Incorrect password. Please try again." };
    }

    // Update last login
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { last_login: new Date() }
    });

    await setSession(user.user_id, user.role, user.store_id);

    return { 
      success: true, 
      user: { 
        id: user.user_id, 
        name: user.name, 
        role: user.role, 
        store: user.store?.name || "My Store" 
      } 
    };
  } catch (error: any) {
    console.error("Login error details:", error);
    return { error: getSafeErrorMessage(error, "An unexpected error occurred on our server. Please try again in a few moments or contact support.") };
  }
}

export async function logout() {
  const { cookies } = await import("next/headers");
  (await cookies()).delete("session");
  const { redirect } = await import("next/navigation");
  redirect("/");
}

export async function loginUserWithGoogle(email: string) {
  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: true },
    });

    if (!user) {
      return { error: "No account found with this Google email. Please register first using the registration form." };
    }

    if (!user.is_active) {
      return { error: "This account has been locked. Please contact support." };
    }

    await setSession(user.user_id, user.role, user.store_id);

    return { 
      success: true, 
      user: { 
        id: user.user_id, 
        name: user.name, 
        role: user.role, 
        store: user.store?.name || "My Store" 
      } 
    };
  } catch (error: any) {
    console.error("Google login error details:", error);
    return { error: getSafeErrorMessage(error, "An unexpected error occurred during Google login. Please try again in a few moments.") };
  }
}

// ─── Request Password Reset OTP ──────────────────────────────────────────────
export async function requestPasswordResetOtp(email: string) {
  if (!email) {
    return { error: "Email is required." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: true, message: "If the email exists, an OTP has been sent." };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        reset_otp: otp,
        reset_otp_expires: expires
      }
    });

    // Send email via sendEmail
    try {
      await sendEmail({
        to: [user.email, "akibaai.eh@gmail.com"],
        subject: `[Akiba AI] Forgot Password OTP Verification`,
        html: `
          <h3>Akiba AI Password Reset Request</h3>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You requested to reset your password. Use the verification OTP code below to set a new password/PIN:</p>
          <h2 style="letter-spacing: 0.2em; font-size: 28px; color: #00694c;">${otp}</h2>
          <p>This code will expire in 15 minutes.</p>
          <br/>
          <p>If you did not make this request, please secure your account.</p>
          <p>Akiba AI Support</p>
        `,
        fromName: "Akiba AI",
      });
    } catch (err) {
      console.error("Failed to send OTP verification email:", err);
    }

    return { success: true, message: "OTP sent successfully. Please check your email!" };
  } catch (error: any) {
    console.error("OTP Request Error:", error);
    return { error: "Failed to process OTP request. Please try again." };
  }
}

// ─── Verify Password Reset OTP ──────────────────────────────────────────────
export async function verifyOtp(email: string, otp: string) {
  if (!email || !otp) {
    return { error: "Email and OTP code are required." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.reset_otp !== otp) {
      return { error: "Invalid OTP code." };
    }

    if (!user.reset_otp_expires || user.reset_otp_expires < new Date()) {
      return { error: "OTP has expired. Please request a new one." };
    }

    return { success: true, message: "OTP verified successfully. Please enter your new password." };
  } catch (error: any) {
    console.error("OTP Verification Error:", error);
    return { error: "Failed to verify OTP. Please try again." };
  }
}

// ─── Reset Password with OTP ──────────────────────────────────────────────────
export async function resetPasswordWithOtp(formData: FormData) {
  const email = formData.get("email") as string;
  const otp = formData.get("otp") as string;
  const password = formData.get("password") as string;

  if (!email || !otp || !password) {
    return { error: "All fields are required." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.reset_otp !== otp) {
      return { error: "Invalid OTP code or email." };
    }

    if (!user.reset_otp_expires || user.reset_otp_expires < new Date()) {
      return { error: "OTP has expired. Please request a new one." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password_hash: hashedPassword,
        reset_otp: null,
        reset_otp_expires: null
      }
    });

    return { success: true, message: "Password updated successfully! You can now log in." };
  } catch (error: any) {
    console.error("Password reset with OTP error:", error);
    return { error: "Failed to reset password. Please try again." };
  }
}
