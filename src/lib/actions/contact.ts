"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function sendContactEmail(formData: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  const { name, email, phone, message } = formData;

  if (!name || !email || !phone || !message) {
    return { error: "All fields are required." };
  }

  try {
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    let emailError = null;

    if (resendKey) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Contact Form <onboarding@resend.dev>",
            to: "akibaai.eh@gmail.com",
            subject: `New Contact Form Submission from ${name}`,
            html: `
              <h3>New Contact Form Submission</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, "<br/>")}</p>
            `,
          }),
        });

        if (response.ok) {
          emailSent = true;
        } else {
          const errData = await response.json();
          emailError = errData.message || "Resend API error";
          console.error("Resend API failed:", errData);
        }
      } catch (err: any) {
        emailError = err.message || "Resend fetch error";
        console.error("Error calling Resend API:", err);
      }
    }

    // Fallback / Audit logging: Record in database SystemLog
    const session = await getSession();
    let storeId = session?.storeId;

    if (!storeId) {
      // Find the first store in the system as a fallback
      const fallbackStore = await prisma.store.findFirst();
      if (fallbackStore) {
        storeId = fallbackStore.id;
      }
    }

    if (storeId) {
      await prisma.systemLog.create({
        data: {
          store_id: storeId,
          type: "CONTACT_FORM_SUBMISSION",
          content: JSON.stringify({
            name,
            email,
            phone,
            message,
            emailSent,
            emailError,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } else {
      console.warn("No store found to link SystemLog entry to.");
    }

    console.log("Contact form submitted successfully:", {
      name,
      email,
      phone,
      message,
      emailSent,
      emailError,
    });

    return { success: true, emailSent };
  } catch (error: any) {
    console.error("Error processing contact form:", error);
    return { error: error.message || "Failed to submit message." };
  }
}
