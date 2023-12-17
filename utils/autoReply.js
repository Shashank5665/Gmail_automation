// autoReply.js
const { google } = require("googleapis");
const { sendMail } = require("./mailer");
const {
  getMessageHeaderValue,
  createLabel,
  addLabelToThread,
} = require("./gmailApi");

const autoReply = async (oAuth2Client) => {
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

      if (isSent) {
        console.log(
          `STEP1 : [ ALREADY REPLIED TO THREAD_ID : ${threadId} ✅ ]`
        );
        return;
      } else {
        console.log(`STEP1 : [ REPLYING TO THREAD_ID : ${threadId} ... ]`);
        // const accessTokenForMail = await oAuth2Client.getAccessToken();
        await sendMail(to, from, subject, threadId, oAuth2Client);
        console.log("STEP2 : [ MAIL SENT SUCCESSFULLY! ✅ ]");

        const vacationLabelId = await createLabel(oAuth2Client);

        const labelAdded = await addLabelToThread(
          threadId,
          vacationLabelId,
          oAuth2Client
        );
        console.log(`STEP4 : [ LABEL ADDED TO THREAD_ID : ${threadId} ✅ ]`);

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

module.exports = autoReply;
