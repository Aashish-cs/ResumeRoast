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

const sendReceiptEmail = async ({ user, amountPaid, hostedInvoiceUrl }) => {
  await sendEmail({
    to: user.email,
    subject: "ResumeRoast receipt",
    text: `Thanks for subscribing to ResumeRoast. Amount paid: $${amountPaid}. Receipt: ${hostedInvoiceUrl || "Stripe receipt"}`,
    html: `<p>Thanks for subscribing to ResumeRoast.</p><p>Amount paid: $${amountPaid}</p>`
  });
};

module.exports = {
  sendReceiptEmail
};
