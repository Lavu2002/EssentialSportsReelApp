// import OpenAI from 'openai';

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// export async function generateSportsScript(celebrity: string): Promise<string> {
//   console.log("function called")
//   const prompt = `Create a 30-second engaging historical reel script about ${celebrity}.
//     Highlight major career milestones, records, and impact on their sport.
//     Use concise, exciting language suitable for social media.`;

//   const response = await openai.chat.completions.create({
//     model: 'gpt-3.5-turbo',
//     messages: [{ role: 'user', content: prompt }],
//     max_tokens: 300,
//     temperature: 0.7,
//   });

//   return response.choices[0].message.content!;
// }

import Groq from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY! // Get your free key from https://console.groq.com
});

export async function generateSportsScript(celebrity: string): Promise<string> {
  console.log("Groq function called");
  
  const prompt = `Create a 30-second engaging historical reel script about ${celebrity}.
    Highlight major career milestones, records, and impact on their sport.
    Use concise, exciting language suitable for social media.`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct", // Groq's fastest free model
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "No content generated";
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error("Failed to generate script");
  }
}