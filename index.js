// index.js
const express = require('express');
const line = require('@line/bot-sdk');

const app = express();

// ตั้งค่าจาก LINE Developers Console
const config = {
  channelAccessToken: 'Sj+hmLvTE/m8lpUUYcsQzE6Ew8pq2zvBQtridxZPpG2dsNYptt7pf7HjfBOkPPQ07W7WWlxqLSwjTFS6DRdLYZBKqUBho76TPWbQ22LCUuqaxcQnlRYsHa5fIJXqc8UJ0GsBMBBuDazRID284zEvkQdB04t89/1O/w1cDnyilFU=',
  channelSecret: '6cad106330224b572c54545c677012c9'
};

app.use('/callback', line.middleware(config));

// รับ webhook
app.post('/callback', (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then(result => res.json(result));
});

// ตอบกลับข้อความ
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `คุณพิมพ์ว่า: ${event.message.text}`
  });
}

const client = new line.messagingApi.MessagingApiClient(config);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
