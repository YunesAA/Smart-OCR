import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import fetch from 'node-fetch';
import { Groq } from 'groq-sdk';

config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));



const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.get('/about', (req, res) => {
    res.sendFile('about.html', { root: 'public' });
});

app.get('/ai', (req, res) => {
    res.sendFile('ai.html', { root: 'public' });
});

app.post('/ai', async (req, res) => {
  const userText = req.body.text;
  console.log('Received OCR text:', userText);
  try {
    const completion = await groq.chat.completions.create({
      messages: [
      {
        "role": "system",
        "content": `You are an OCR error corrector. You will receive text with potential OCR errors.

      Your job is to:
      - Correct all spelling and recognition errors to produce clean, grammatically correct, natural-language text.
      - Do not explain or interpret the meaning of the input.
      - Do not guess what the user "might have meant". Just correct what is obviously incorrect based on spelling/grammar.
      - Do not say things like "it appears", "probably", "file name", or "error-free text".
      - Do not include any commentary, explanation, or labels.
      - If the input is already correct, return it as-is.

      Only output the corrected text. No extra words. if the input is empty, return an empty string.`,      
      },
      { role: 'user', content: userText }
      ],
      model: 'llama3-8b-8192'
    });

    const cleanedText = completion.choices[0].message.content;
    res.json({ cleaned: cleanedText });

  } catch (err) {
    console.error('Error calling Groq API:', err);
    res.status(500).json({ error: 'OCR processing failed.' });
  }
});


// OCR
app.post('/ocr', async (req, res) => {
  const { base64Image } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: "No image provided" });
  }

  const formData = new URLSearchParams();
  formData.append("apikey", process.env.OCR_SPACE_API_KEY);
  formData.append("base64Image", `data:image/png;base64,${base64Image}`);
  formData.append("language", "eng");

  try {
    const ocrRes = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const data = await ocrRes.json();
    const text = data.ParsedResults?.[0]?.ParsedText || "";

    res.json({ cleaned: text });
  } catch (err) {
    console.error("OCR API Error:", err);
    res.status(500).json({ error: "OCR processing failed" });
  }
});

// AI cleaning
app.post('/ai', async (req, res) => {
  const userText = req.body.text;

  if (!userText) {
    return res.json({ cleaned: "" });
  }

  console.log('Received OCR text:', userText);

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an OCR error corrector. You will receive text with potential OCR errors.

Your job is to:
- Correct all spelling and recognition errors to produce clean, grammatically correct, natural-language text.
- Do not explain or interpret the meaning of the input.
- Do not guess what the user "might have meant". Just correct what is obviously incorrect based on spelling/grammar.
- Do not say things like "it appears", "probably", "file name", or "error-free text".
- Do not include any commentary, explanation, or labels.
- If the input is already correct, return it as-is.

Only output the corrected text. No extra words. If the input is empty, return an empty string.`
        },
        { role: 'user', content: userText }
      ],
      model: 'llama3-8b-8192'
    });

    const cleanedText = completion.choices[0].message.content;
    res.json({ cleaned: cleanedText });

  } catch (err) {
    console.error('Error calling Groq API:', err);
    res.status(500).json({ error: 'AI cleaning failed.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
