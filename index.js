import * as line from '@line/bot-sdk'
import express from 'express'
import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';


// create LINE SDK config from env variables
const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// create LINE SDK client
const client = line.LineBotClient.fromChannelAccessToken({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  //process.env.SUPABASE_KEY
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})


// get method
app.get('/', (req, res) => {
  res.send('hello world, khemyothin Sethongseau2');
});


// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

/*
// event handler
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  // create an echoing text message
  const echo = { type: 'text', text: event.message.text };

  // use reply API
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [echo],
  });
}
*/

// 4. ฟังก์ชันหลักในการจัดการ Event และบันทึกข้อมูล
async function handleEvent(event) {
  // รองรับเฉพาะ Event ประเภทข้อความ (Message Event) เท่านั้น
  if (event.type !== 'message') {
    return null;
  }

  const userId = event.source.userId || 'unknown';
  const replyToken = event.replyToken || '';
 
  // ดึงข้อมูลพื้นฐานจาก Message Object ของ LINE
  const messageId = event.message.id;
  const messageType = event.message.type; // text, image, sticker, video, etc.
 
  let content = null;
  let botReplyText = '';

  // ตรวจสอบเงื่อนไขตามประเภทข้อความ
  if (event.message.type === 'text') {
    content = event.message.text;
    botReplyText = event.message.text; // ข้อความที่จะตอบกลับ (Echo)
  } else {
    // หากเป็นประเภทอื่น เช่น image, sticker, video
    content = `[Received ${messageType} message]`;
    botReplyText = `ได้รับข้อความประเภท ${messageType} แล้วครับ`;
  }

  try {
    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: content,
    })

    botReplyText = geminiResponse.text || 'ระบบไม่สามารถสร้างคำตอบได้'
    // บันทึกข้อมูลลงตาราง messages ใน Supabase (บันทึกคู่ทั้งคำถามและคำตอบที่เตรียมไว้)
    const { error } = await supabase
      .from('messages')
      .insert([
        {
          user_id: userId,
          message_id: messageId,
          type: messageType,
          content: content,
          reply_token: replyToken,
          reply_content: botReplyText
        }
      ]);

    if (error) {
      console.error('Supabase Insert Error:', error.message);
    }

    // ตอบกลับข้อความไปยังผู้ใช้ใน LINE
    return await client.replyMessage({
      replyToken: replyToken,
      messages: [
        {
          type: 'text',
          text: botReplyText,
        },
      ],
    });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการประมวลผลระบบ:', error);
  }
}


// listen on port
const port = process.env.PORT || 3020;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});