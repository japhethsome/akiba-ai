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
        // Fetch the store owner's email dynamically to allow successful testing in Resend sandbox
        const fallbackStore = await prisma.store.findFirst({
          include: { users: { where: { role: "owner" } } }
        });
        const ownerEmail = fallbackStore?.users[0]?.email || "akibaai.eh@gmail.com";

        // Try sending to the store owner first
        let recipientEmail = ownerEmail;

        let response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Contact Form <onboarding@resend.dev>",
            to: recipientEmail,
            subject: `[Support Inquiry] ${name}`,
            html: `
              <h3>New Support Inquiry (Contact Form Submission)</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, "<br/>")}</p>
            `,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const isSandboxError = errData.message?.toLowerCase().includes("sandbox") || 
                                 errData.message?.toLowerCase().includes("restricted") ||
                                 errData.message?.toLowerCase().includes("can only send");

          if (isSandboxError) {
            // Find current session email to retry sending to their verified sandbox email
            const session = await getSession();
            let sessionEmail = "";
            if (session) {
              const activeUser = await prisma.user.findUnique({
                where: { user_id: session.userId }
              });
              sessionEmail = activeUser?.email || "";
            }

            if (sessionEmail && sessionEmail.toLowerCase() !== recipientEmail.toLowerCase()) {
              console.log(`Sandbox error. Retrying with session email: ${sessionEmail}`);
              recipientEmail = sessionEmail;

              response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${resendKey}`,
                },
                body: JSON.stringify({
                  from: "Contact Form <onboarding@resend.dev>",
                  to: recipientEmail,
                  subject: `[Redirected Support] ${name}`,
                  html: `
                    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 12px; margin-bottom: 20px; border-radius: 8px; font-size: 12px; font-family: sans-serif;">
                      <strong>[Sandbox Notice]</strong> This inquiry was originally routed to <strong>${ownerEmail}</strong> but failed due to sandbox constraints. We redirected it to your verified account email <strong>${sessionEmail}</strong>.
                    </div>
                    <h3>New Support Inquiry</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message.replace(/\n/g, "<br/>")}</p>
                  `,
                }),
              });
            }

            // If it still failed (or no session email), retry fallback support inbox: akibaai.eh@gmail.com
            if (!response.ok && recipientEmail.toLowerCase() !== "akibaai.eh@gmail.com") {
              recipientEmail = "akibaai.eh@gmail.com";
              console.log(`Sandbox error. Final retry to akibaai.eh@gmail.com`);

              response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${resendKey}`,
                },
                body: JSON.stringify({
                  from: "Contact Form <onboarding@resend.dev>",
                  to: recipientEmail,
                  subject: `[Fallback Support] ${name}`,
                  html: `
                    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 12px; margin-bottom: 20px; border-radius: 8px; font-size: 12px; font-family: sans-serif;">
                      <strong>[Sandbox Notice]</strong> Retried fallback routing to <strong>akibaai.eh@gmail.com</strong>.
                    </div>
                    <h3>New Support Inquiry</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message.replace(/\n/g, "<br/>")}</p>
                  `,
                }),
              });
            }
          }
        }

        if (response.ok) {
          emailSent = true;
        } else {
          const errData = await response.json().catch(() => ({}));
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
