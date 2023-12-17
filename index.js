const express = require("express");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const PORT = process.env.PORT || 8000;

dotenv.config();
const app = express();
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

//-----------------------------------------------------------------------------------------

//send email using nodemailer
const sendMail = async (from, to, subject, messageId) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "shashucr567@gmail.com",
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
//------------------------------------------------------------------------------------------

const getMessageHeaderValue = (headers, name) =>
  (headers.find((head) => head.name === name) || {}).value;

//------------------------------------------------------------------------------------------

//isolate the threads in which no prior reply has been sent by me
const autoReply = async () => {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const res = await gmail.users.threads.list({
      userId: "me",
      maxResults: 1,
    });
    let threads = res.data.threads;

    threads.forEach(async (thread) => {
      const threadId = thread.id;
      const res = await gmail.users.threads.get({
        userId: "me",
        id: threadId,
      });
      const messages = res.data.messages;
      const firstMessage = messages[0];
      const from = getMessageHeaderValue(firstMessage.payload.headers, "From");
      const to = getMessageHeaderValue(firstMessage.payload.headers, "To");
      const subject = getMessageHeaderValue(
        firstMessage.payload.headers,
        "Subject"
      );

      let isSent = false;
      messages.forEach(async (message) => {
        const labels = message.labelIds;
        if (labels.includes("SENT")) {
          isSent = true;
        }
      });

      //if the thread does not have the sent label, send a reply saying "replying to you"
      if (isSent) {
        console.log(
          `STEP1 : [ ALREADY REPLIED TO THREAD_ID : ${threadId} ✅ ]`
        );
        return;
      } else {
        console.log(`STEP1 : [ REPLYING TO THREAD_ID : ${threadId} ... ]`);
        await sendMail(to, from, subject, threadId);
        console.log("STEP2 : [ MAIL SENT SUCCESSFULLY! ✅ ]");

        //check for a specific label, if its not present, create one
        const res = await gmail.users.labels.list({ userId: "me" });
        const labels = res.data.labels;

        // check if "vacation" name label is present
        let isLabelPresent = false;
        let vacationLabelId = "";
        labels.forEach((label) => {
          if (label.name === "vacation") {
            isLabelPresent = true;
            vacationLabelId = label.id;
          }
        });

        if (!isLabelPresent) {
          console.log("STEP3 : [ LABEL NOT PRESENT ❌ ]");
        } else {
          console.log("STEP3 : [ LABEL PRESENT ✅ ]");
        }

        //if not present, create one
        if (!isLabelPresent) {
          const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
          const newLabel = await gmail.users.labels.create({
            userId: "me",
            requestBody: {
              name: "vacation",
              messageListVisibility: "show",
              labelListVisibility: "labelShow",
            },
          });
          vacationLabelId = newLabel.data.id;
        }

        //add the label to the thread
        const labelAdded = await gmail.users.threads.modify({
          userId: "me",
          id: threadId,
          requestBody: {
            addLabelIds: [vacationLabelId],
          },
        });
        console.log(`STEP4 : [ LABEL ADDED TO THREAD_ID : ${threadId} ✅ ]`);
        //also remove the "unread" label from the thread
        const labelRemoved = await gmail.users.threads.modify({
          userId: "me",
          id: threadId,
          requestBody: {
            removeLabelIds: ["UNREAD"],
          },
        });
        return;
      }
    });
  } catch (error) {
    console.log(error);
  }
};

function randomInterval() {
  return Math.floor(Math.random() * (120000 - 45000 + 1)) + 45000;
}

// setInterval(() => {
autoReply();
// }, randomInterval());

//------------------------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log("STEP0 : [ SERVER STARTED ON PORT : " + PORT + " ✅ ]");
});
