const sgMail = require("@sendgrid/mail");
const config = require("../config/env");

if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

const sendEmail = async ({ to, subject, text, html }) => {
  if (!config.sendgrid.apiKey) {
    console.log(`[email skipped] To: ${to}`);
    console.log(`[email skipped] Subject: ${subject}`);
    console.log(text);
    return { skipped: true };
  }

  await sgMail.send({
    to,
    from: config.sendgrid.fromEmail,
    subject,
    text,
    html
  });

  return { skipped: false };
};

const sendVerificationEmail = async ({ user, token }) => {
  const verificationUrl = `${config.clientUrl}/verify-email?token=${token}`;
  const result = await sendEmail({
    to: user.email,
    subject: "Verify your ResumeRoast account",
    text: `Welcome to ResumeRoast. Verify your email here: ${verificationUrl}`,
    html: `<p>Welcome to ResumeRoast.</p><p><a href="${verificationUrl}">Verify your email</a></p>`
  });

  return {
    ...result,
    verificationUrl: config.env === "production" ? undefined : verificationUrl
  };
};

const sendPasswordResetEmail = async ({ user, token }) => {
  const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
  const result = await sendEmail({
    to: user.email,
    subject: "Reset your ResumeRoast password",
    text: `Reset your password here: ${resetUrl}`,
    html: `<p><a href="${resetUrl}">Reset your password</a></p>`
  });

  return {
    ...result,
    resetUrl: config.env === "production" ? undefined : resetUrl
  };
};

const sendReceiptEmail = async ({ user, amountPaid, hostedInvoiceUrl }) => {
  await sendEmail({
    to: user.email,
    subject: "ResumeRoast receipt",
    text: `Thanks for subscribing to ResumeRoast. Amount paid: $${amountPaid}. Receipt: ${hostedInvoiceUrl || "Stripe receipt"}`,
    html: `<p>Thanks for subscribing to ResumeRoast.</p><p>Amount paid: $${amountPaid}</p>`
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendReceiptEmail
};
