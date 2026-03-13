import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "BuilderBlue² <noreply@builderblue2.com>";

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to BuilderBlue²",
      text: `Hi ${name},\n\nWelcome to BuilderBlue²! Your account is ready.\n\nLog in at ${process.env.BASE_URL}/login to get started.\n\n— The BuilderBlue² Team`,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

export async function sendMagicLinkEmail(
  email: string,
  token: string
): Promise<void> {
  const link = `${process.env.BASE_URL}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Your BuilderBlue² login link",
      text: `Click the link below to log in to BuilderBlue²:\n\n${link}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\n— The BuilderBlue² Team`,
    });
  } catch (error) {
    console.error("Failed to send magic link email:", error);
  }
}
