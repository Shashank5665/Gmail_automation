const express = require("express");
const dotenv = require("dotenv");
const autoReply = require("./utils/autoReply");
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

function randomInterval() {
  return Math.floor(Math.random() * (120000 - 45000 + 1)) + 45000;
}

setInterval(() => {
  autoReply(oAuth2Client);
}, randomInterval());

app.listen(PORT, () => {
  console.log("STEP0 : [ SERVER STARTED ON PORT : " + PORT + " ✅ ]");
});
