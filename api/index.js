import admin from "firebase-admin";
import fs from "fs";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    fs.readFileSync("./firebaseServiceAccount.json", "utf8")
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
  });
}

const db = admin.database();

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === "GET") {
      // Query param: type=soil or type=cattle
      const type = req.query.type;
      if (type === "soil") {
        const snapshot = await db.ref("soil").once("value");
        res.status(200).json(snapshot.val());
      } else if (type === "cattle") {
        const snapshot = await db.ref("cattle").once("value");
        res.status(200).json(snapshot.val());
      } else {
        res.status(400).json({ error: "Invalid type" });
      }
    } else if (method === "POST") {
      // Chatbot endpoint
      const { message } = req.body;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
          }),
        }
      );

      const data = await response.json();
      const reply = data.candidates[0].content.parts[0].text;
      res.status(200).json({ reply });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
