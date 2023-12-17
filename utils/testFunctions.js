const getListOfMessages = async () => {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const res = await gmail.users.messages.get({
      userId: "me",
      // maxResults: 2,
      id: "18c76c62cdcf8313",
      // q: "is:unread",
    });
    const message = res.data.payload.headers;
    console.log(message);
    // messages.forEach(async (message) => {
    // const messageId = message.id;
    // const res = await gmail.users.messages.get({
    //   userId: "me",
    //   id: messageId,
    // });
    // console.log("Thread id -->", message.threadId);
    // console.log("Message id -->", messageId + "\n" + res.data.snippet);
    // });
    // console.log(messages[0]);
  } catch (error) {
    console.log(error);
  }
};

const getLabels = async () => {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const res = await gmail.users.labels.list({
      userId: "me",
    });
    console.log(res.data.labels);
  } catch (error) {
    console.log(error);
  }
};

//modify the latest un-read message by adding a label to it
const modifyMessage = async () => {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const maessage = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,
    });
    const messageId = maessage.data.messages[0].id;
    const res = await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        addLabelIds: ["Label_4592119404144451167"],
      },
    });
    console.log(res.data);
  } catch (error) {
    console.log(error.message);
  }
};

//get single thread
const getSingleThread = async () => {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const res = await gmail.users.threads.get({
      userId: "me",
      id: "18c3d0ab31b86daf", //multiple
      // id: "18c73b9bcec9f69e", //single
      // thread id : "18c73b98a666c2c9" single
    });

    const messages = res.data.messages;
    console.log(messages.length);

    if (messages.length === 1) {
      console.log("Reply sent!");
      return;
    }

    const fromEmailAddresses = [];

    // Use a single loop to directly extract "From" email addresses
    messages.forEach((message) => {
      const header = message.payload.headers.find(
        (head) => head.name === "From"
      );
      if (header) {
        const inputString = header.value;
        const startBracketIndex = inputString.indexOf("<");
        const endBracketIndex = inputString.indexOf(">");

        if (startBracketIndex !== -1 && endBracketIndex !== -1) {
          const email = inputString.substring(
            startBracketIndex + 1,
            endBracketIndex
          );
          fromEmailAddresses.push(email.trim());
        }
      }
    });

    console.table(fromEmailAddresses);
  } catch (error) {
    console.log(error.message);
  }
};

//get threads
const threadIds = [];
const getAllThreads = async () => {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const res = await gmail.users.threads.get({
      userId: "me",
      // maxResults: 1,
      id: "18c75cdd683f28f0",
    });
    // const threads = res.data.threads;
    //push ids of each threads into threadIds array
    // threads.forEach((thread) => {
    //   threadIds.push(thread.id);
    // });

    console.log(res.data.messages);
  } catch (error) {
    console.log(error.message);
  }
};
