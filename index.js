// index.js
require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');

const app = express();

// ตั้งค่าจาก LINE Developers Console
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: process.env.LINE_CHANNEL_SECRET || ""
};


app.use('/webhook', line.middleware(config));

//get
app.get('/', (req, res) => {
  res.send('hello world, khemyothin');
});


//รับขWebhook
app.post('/webhook', (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then(result => res.json(result));
});

// ตอบกลับข้อความ
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: 'text',
        text: `คุณพิมพ์ว่า: ${event.message.text}`
      }
    ]
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});