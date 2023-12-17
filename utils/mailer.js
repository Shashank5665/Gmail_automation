// mailer.js
const nodemailer = require("nodemailer");

const sendMail = async (from, to, subject, messageId, oAuth2Client) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: from,
      to: to,
      subject: `Re: ${subject}`,
      text: `Hello ${subject}`,
      inReplyTo: messageId,
      references: messageId,
    };

    const result = await transport.sendMail(mailOptions);
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = { sendMail };
