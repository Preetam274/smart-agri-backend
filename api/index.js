import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import admin from "firebase-admin";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// 🔹 Initialize Firebase (only once, prevent re-initialization on hot reloads)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.FIREBASE_DB_URL,
  });
}

const db = admin.database();

// Routes
app.get("/api/soil-data", async (req, res) => {
  try {
    const snapshot = await db.ref("soil").once("value");
    res.json(snapshot.val());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/cattle-data", async (req, res) => {
  try {
    const snapshot = await db.ref("cattle").once("value");
    res.json(snapshot.val());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      { contents: [{ parts: [{ text: message }] }] },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
      }
    );

    const reply = response.data.candidates[0].content.parts[0].text;
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Export Express app as Vercel handler
export default app;
