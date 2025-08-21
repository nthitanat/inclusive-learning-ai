import { ChatOpenAI } from "@langchain/openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function callSimpleLLM(prompt: string): Promise<string> {
  console.log("🤖 Calling Simple LLM");
  try {
    const chatModel = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.5,
      openAIApiKey: OPENAI_API_KEY,
    });

    const response = await chatModel.invoke([
      {
        role: "system",
        content: "คุณคือผู้เชี่ยวชาญด้านการศึกษาและผู้ออกแบบแผนการสอน ตอบเป็นภาษาไทยเท่านั้น"
      },
      {
        role: "user", 
        content: prompt
      }
    ]);
    
    console.log("✅ Simple LLM response:", response.content);
    return response.content as string;
  } catch (error) {
    console.error("❌ Simple LLM Error:", error);
    throw new Error("Failed to get AI response");
  }
}
