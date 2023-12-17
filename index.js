const express = require("express");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const PORT = process.env.PORT || 8000;

//----------------------------------CONFIGURATION--------------------------------------------
dotenv.config();
const app = express();
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

//-------------------------------NOMAILER SEND MAIL FUNCTION----------------------------------

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
//------------------------------GET MESSAGE HEADER VALUE--------------------------------------

const getMessageHeaderValue = (headers, name) =>
  (headers.find((head) => head.name === name) || {}).value;

//----------------------------------AUTO REPLY FUNCTION---------------------------------------

const autoReply = async () => {
  try {
    // CREATING GMAIL CLIENT FROM GOOGLE API
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const res = await gmail.users.threads.list({
      userId: "me",
      maxResults: 1,
    });

    // GET 'N' NUMBER OF THREADS
    let threads = res.data.threads;
    threads.forEach(async (thread) => {
      const threadId = thread.id;
      const res = await gmail.users.threads.get({
        userId: "me",
        id: threadId,
      });

      // GET ALL THE MESSAGES IN THE THREAD
      const messages = res.data.messages;

      // FOR HEADER DETAILS, WE CAN GET IT FROM THE ANY ONE MESSAGE
      const firstMessage = messages[0];
      const from = getMessageHeaderValue(firstMessage.payload.headers, "From");
      const to = getMessageHeaderValue(firstMessage.payload.headers, "To");
      const subject = getMessageHeaderValue(
        firstMessage.payload.headers,
        "Subject"
      );

      // CHECK IF THE THREAD HAS THE SENT LABEL, IF YES, THAT MEANS WE HAVE ALREADY REPLIED TO THE THREAD
      let isSent = false;
      messages.forEach(async (message) => {
        const labels = message.labelIds;
        if (labels.includes("SENT")) {
          isSent = true;
        }
      });

      // IF WE HAVE ALREADY REPLIED TO THE THREAD, THEN DO NOTHING
      if (isSent) {
        console.log(
          `STEP1 : [ ALREADY REPLIED TO THREAD_ID : ${threadId} ✅ ]`
        );
        return;
      } else {
        // IF WE HAVE NOT REPLIED TO THE THREAD, THEN SEND AUTO-REPLY
        console.log(`STEP1 : [ REPLYING TO THREAD_ID : ${threadId} ... ]`);
        await sendMail(to, from, subject, threadId);
        console.log("STEP2 : [ MAIL SENT SUCCESSFULLY! ✅ ]");

        // GET ALL THE LABELS
        const res = await gmail.users.labels.list({ userId: "me" });
        const labels = res.data.labels;

        // CHECK IF THE "VACATION" LABEL IS PRESENT ( IN THIS CASE )
        let isLabelPresent = false;
        let vacationLabelId = "";
        labels.forEach((label) => {
          if (label.name === "vacation") {
            isLabelPresent = true;
            vacationLabelId = label.id;
          }
        });

        // GIVE OUT RELEVANT MESSAGES
        if (!isLabelPresent) {
          console.log("STEP3 : [ LABEL NOT PRESENT ❌ ]");
        } else {
          console.log("STEP3 : [ LABEL PRESENT ✅ ]");
        }

        // IF THE LABEL IS NOT PRESENT, THEN CREATE THE LABEL
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

        // ADD THE "VACATION" LABEL TO THE THREAD
        const labelAdded = await gmail.users.threads.modify({
          userId: "me",
          id: threadId,
          requestBody: {
            addLabelIds: [vacationLabelId],
          },
        });
        console.log(`STEP4 : [ LABEL ADDED TO THREAD_ID : ${threadId} ✅ ]`);

        // REMOVE THE "UNREAD" LABEL FROM THE THREAD
        const labelRemoved = await gmail.users.threads.modify({
          userId: "me",
          id: threadId,
          requestBody: {
            removeLabelIds: ["UNREAD"],
          },
        });

        // RETURNING FROM THE CURRENT ITERATION ( LABEL ITERATION )
        return;
      }
    });
  } catch (error) {
    console.log(error);
  }
};

// GENERATING RANDOM INTERVAL BETWEEN 45 SECONDS TO 120 SECONDS
function randomInterval() {
  return Math.floor(Math.random() * (120000 - 45000 + 1)) + 45000;
}

// FINALLY CALLING THE AUTO-REPLY FUNCTION
setInterval(() => {
  autoReply();
}, randomInterval());

//------------------------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log("STEP0 : [ SERVER STARTED ON PORT : " + PORT + " ✅ ]");
});
