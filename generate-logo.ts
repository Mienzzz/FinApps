import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function generateLogo() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  
  console.log("Generating logo...");
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: "A modern, minimalist app logo for a financial tracker named 'FinApp's'. The logo should feature a stylized wallet or a growing chart symbol, using a professional color palette of deep indigo and vibrant emerald green. Clean lines, flat design, suitable for a mobile app icon, high resolution, white background.",
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  });

  let imagePartFound = false;
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64Data = part.inlineData.data;
      const buffer = Buffer.from(base64Data, 'base64');
      
      const publicDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
      }
      
      fs.writeFileSync(path.join(publicDir, 'icon-512.png'), buffer);
      fs.writeFileSync(path.join(publicDir, 'icon-192.png'), buffer); // Using same for now
      console.log("Logo saved to public/icon-512.png and public/icon-192.png");
      imagePartFound = true;
      break;
    }
  }

  if (!imagePartFound) {
    console.error("No image part found in the response");
  }
}

generateLogo().catch(console.error);
