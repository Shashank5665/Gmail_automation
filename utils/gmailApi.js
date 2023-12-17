// gmailApi.js
const { google } = require("googleapis");

const getMessageHeaderValue = (headers, name) =>
  (headers.find((head) => head.name === name) || {}).value;

const createLabel = async (oAuth2Client) => {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  const res = await gmail.users.labels.list({ userId: "me" });
  const labels = res.data.labels;

  let isLabelPresent = false;
  let vacationLabelId = "";

  labels.forEach((label) => {
    if (label.name === "vacation") {
      isLabelPresent = true;
      vacationLabelId = label.id;
    }
  });

  if (!isLabelPresent) {
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

  return vacationLabelId;
};

const addLabelToThread = async (threadId, labelId, oAuth2Client) => {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: {
      addLabelIds: [labelId],
    },
  });
};

module.exports = {
  getMessageHeaderValue,
  createLabel,
  addLabelToThread,
};
