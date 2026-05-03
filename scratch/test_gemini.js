const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const apiKey = "AIzaSyDCu1HbARaJiZq1aCrmFTpkRfIyw28NGcY";
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log("Testing gemini-1.5-flash with v1...");
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }, { apiVersion: 'v1' });
    const result = await model.generateContent("Hello");
    console.log("Success with v1!");
  } catch (error) {
    console.error("Failed with v1:", error.message);
  }
}

testGemini();
