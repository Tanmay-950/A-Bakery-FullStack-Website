const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email templates
const templates = {
  welcome: (data) => ({
    subject: '🎂 Welcome to Ghochu Pizza!',
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #fff8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #e07b00, #c8430a); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🍕 Ghochu Pizza</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Fresh Cakes, Delicious Pizza & Sweet Memories</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #2d1b00;">Welcome, ${data.name}! 🎉</h2>
          <p style="color: #5a3c1a; line-height: 1.7;">Your account has been created successfully. Start exploring our delicious menu!</p>
          <a href="${process.env.CLIENT_URL}/menu" style="display: inline-block; background: linear-gradient(135deg, #e07b00, #c8430a); color: white; padding: 14px 32px; border-radius: 24px; text-decoration: none; font-weight: bold; margin-top: 16px;">Explore Menu 🍕</a>
        </div>
        <div style="background: #2d1b00; padding: 20px; text-align: center; color: #9a7a5a; font-size: 13px;">
          <p>© 2026 Ghochu Pizza | Abu Road, Rajasthan</p>
        </div>
      </div>
    `,
  }),

  orderConfirmation: (data) => ({
    subject: `🎉 Order Confirmed - ${data.orderNumber}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #e07b00, #c8430a); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">🍕 Order Confirmed!</h1>
        </div>
        <div style="padding: 28px; background: #fff;">
          <p style="color: #2d1b00;">Hi <strong>${data.name}</strong>,</p>
          <p style="color: #5a3c1a;">Your order <strong>${data.orderNumber}</strong> has been confirmed!</p>
          <div style="background: #fff8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #c8430a; margin: 0 0 12px;">Order Summary</h3>
            ${data.items.map(i => `<p style="margin: 4px 0; color: #5a3c1a;">${i.name} × ${i.quantity} — ₹${i.price * i.quantity}</p>`).join('')}
            <hr style="border: 1px solid #ffe0b2; margin: 12px 0;" />
            <p style="font-weight: bold; color: #c8430a; font-size: 18px;">Total: ₹${data.totalPrice}</p>
          </div>
          <p style="color: #5a3c1a;">Payment: <strong>${data.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</strong></p>
          <p style="color: #5a3c1a;">Estimated delivery: <strong>30–45 minutes</strong></p>
        </div>
      </div>
    `,
  }),

  orderStatus: (data) => ({
    subject: `📦 Order Update: ${data.status.replace(/_/g, ' ').toUpperCase()}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #e07b00, #c8430a); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">📦 Order Update</h1>
        </div>
        <div style="padding: 28px;">
          <p>Hi <strong>${data.name}</strong>,</p>
          <p>Your order status has been updated to: <strong style="color: #c8430a;">${data.status.replace(/_/g, ' ').toUpperCase()}</strong></p>
          ${data.note ? `<p>${data.note}</p>` : ''}
          <a href="${process.env.CLIENT_URL}/orders/${data.orderId}" style="display: inline-block; background: linear-gradient(135deg, #e07b00, #c8430a); color: white; padding: 12px 28px; border-radius: 24px; text-decoration: none; font-weight: bold;">Track Order</a>
        </div>
      </div>
    `,
  }),

  resetPassword: (data) => ({
    subject: '🔑 Reset Your Password',
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #e07b00, #c8430a); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔑 Password Reset</h1>
        </div>
        <div style="padding: 28px;">
          <p>Hi <strong>${data.name}</strong>,</p>
          <p>Click the button below to reset your password. This link expires in 15 minutes.</p>
          <a href="${data.resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #e07b00, #c8430a); color: white; padding: 14px 32px; border-radius: 24px; text-decoration: none; font-weight: bold;">Reset Password</a>
          <p style="color: #9a7a5a; font-size: 13px; margin-top: 20px;">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  }),
};

const sendEmail = async ({ to, subject, template, data, html }) => {
  let emailHtml = html;
  let emailSubject = subject;

  if (template && templates[template]) {
    const rendered = templates[template](data);
    emailHtml = rendered.html;
    emailSubject = rendered.subject || subject;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Ghochu Pizza <noreply@ghochupizza.com>',
    to,
    subject: emailSubject,
    html: emailHtml,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
