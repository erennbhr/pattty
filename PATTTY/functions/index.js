const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// 🔑 API Key'ini buraya yapıştır
const API_KEY = "AIzaSyCKmrZu8ZYJHomorDx83cv1wQEPlRb3ICs"; 
const genAI = new GoogleGenerativeAI(API_KEY);

exports.chatWithAI = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Uygulamadan gelen "contents" verisini al (Yazı + Resim içerir)
      const { contents } = req.body;

      if (!contents) {
        return res.status(400).send({ error: "İçerik (contents) eksik." });
      }

      // En hızlı ve yetenekli model: Gemini 2.5 Flash
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // İsteği Gemini'ye gönder
      const result = await model.generateContent({ contents });
      const response = await result.response;
      const text = response.text();

      // Cevabı uygulamaya geri döndür
      return res.status(200).send({ text });

    } catch (error) {
      console.error("AI Sunucu Hatası:", error);
      return res.status(500).send({ error: error.message || "Sunucu hatası" });
    }
  });
});