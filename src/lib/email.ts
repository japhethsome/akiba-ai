import nodemailer from "nodemailer";

export async function sendEmail({
  to,
  subject,
  html,
  fromName = "Akiba Yangu"
}: {
  to: string | string[];
  subject: string;
  html: string;
  fromName?: string;
}) {
  const smtpServer = process.env.SMTPSERVER;
  const emailUser = process.env.EMAILUSER;
  const emailPassword = process.env.EMAILPASSWORD;

  if (smtpServer && emailUser && emailPassword) {
    const port = process.env.SMTPPORT ? parseInt(process.env.SMTPPORT, 10) : 465;
    const secure = process.env.SMTPSECURE !== "false";

    const transporter = nodemailer.createTransport({
      host: smtpServer.trim(),
      port,
      secure,
      auth: {
        user: emailUser.trim(),
        pass: emailPassword.trim(),
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const recipient = Array.isArray(to) ? to.join(", ") : to;
    const info = await transporter.sendMail({
      from: `"${fromName}" <${emailUser.trim()}>`,
      to: recipient,
      subject,
      html,
    });
    console.log("Email sent successfully via SMTP:", info.messageId);
    return { success: true, messageId: info.messageId };
  }

  // Fallback to Resend if SMTP is not configured
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const recipientList = Array.isArray(to) ? to : [to];
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <akibaai.eh@gmail.com>`,
        to: recipientList,
        subject,
        html,
      }),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log("Email sent successfully via Resend API:", data.id);
      return { success: true, messageId: data.id };
    } else {
      const errData = await response.json().catch(() => ({}));
      console.error("Resend API failed:", errData);
      throw new Error(errData.message || "Resend API error");
    }
  }

  throw new Error("No email service configured. Please set SMTP credentials or RESEND_API_KEY.");
}
