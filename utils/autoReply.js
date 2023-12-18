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

    // GET 'N' NUMBER OF THREADS FROM OUT INBOX
    let threads = res.data.threads;
    threads.forEach(async (thread) => {
      const threadId = thread.id;
      const res = await gmail.users.threads.get({
        userId: "me",
        id: threadId,
      });

      // GET MESSAGES OF EACH THREADS,
      // FOR HEADER VALUES, WE CAN JUST GET IT FROM ONE MESSAGE, FIRST MESSAGE IN THIS CASE
      const messages = res.data.messages;
      const firstMessage = messages[0];
      const from = getMessageHeaderValue(firstMessage.payload.headers, "From");
      const to = getMessageHeaderValue(firstMessage.payload.headers, "To");
      const subject = getMessageHeaderValue(
        firstMessage.payload.headers,
        "Subject"
      );

      // CHECK IF THE THREAD IS ALREADY REPLIED OR NOT
      let isSent = false;
      messages.forEach(async (message) => {
        const labels = message.labelIds;
        if (labels.includes("SENT")) {
          isSent = true;
        }
      });

      // IF THREAD IS ALREADY REPLIED, THEN JUST RETURN
      if (isSent) {
        console.log(
          `STEP1 : [ ALREADY REPLIED TO THREAD_ID : ${threadId} ✅ ]`
        );
        return;

        // IF THREAD IS NOT REPLIED, THEN REPLY TO THE THREAD
      } else {
        console.log(`STEP1 : [ REPLYING TO THREAD_ID : ${threadId} ... ]`);

        // SEND REPLY MAIL
        await sendMail(to, from, subject, threadId, oAuth2Client);
        console.log("STEP2 : [ MAIL SENT SUCCESSFULLY! ✅ ]");

        const vacationLabelId = await createLabel(oAuth2Client);

        const labelAdded = await addLabelToThread(
          threadId,
          vacationLabelId,
          oAuth2Client
        );
        console.log(`STEP4 : [ LABEL ADDED TO THREAD_ID : ${threadId} ✅ ]`);

        // REMOVE 'UNREAD' LABEL FROM THE THREAD ( SO THAT WE DON'T REPLY TO THE SAME THREAD AGAIN)
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
