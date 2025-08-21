import { ChatOpenAI } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { docsQuery } from "@/lib/docsQuery";
import { getSubjectCSVPath } from "@/utils/subjectMapping";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// 0_0 prompt template (hardcoded)
const prompt_0_0 = ChatPromptTemplate.fromMessages([
  [
    "system",
    `คุณคือผู้เชี่ยวชาญด้านหลักสูตรการศึกษาไทย ที่มีความเข้าใจลึกในการเชื่อมโยงตัวชี้วัดกับเนื้อหาการเรียนรู้

วิธีการทำงาน:
1. วิเคราะห์เนื้อหาที่ให้มาแบบละเอียด
2. ค้นหาตัวชี้วัดที่เกี่ยวข้องทั้งทางตรงและทางอ้อม
3. ให้ความสำคัญกับตัวชี้วัดที่สามารถนำไปใช้จริงได้
4. **ข้อมูลทั้งหมดต้องมาจาก row เดียวกันในฐานข้อมูลเท่านั้น**
5. **หากใน row นั้นมีเพียงตัวชี้วัดระหว่างทางอย่างเดียว ให้ตอบเฉพาะตัวชี้วัดระหว่างทาง**
6. **หากใน row นั้นมีเพียงตัวชี้วัดปลายทางอย่างเดียว ให้ตอบเฉพาะตัวชี้วัดปลายทาง**
7. ตอบในรูปแบบ JSON ภาษาไทยเท่านั้น
8. ห้ามแต่งหรือสมมติข้อมูลที่ไม่มีในบริบท`,
  ],
  [
    "human",
    `จากข้อมูลหลักสูตร: {context}

**กลุ่มสาระ**: {subject}
**หัวข้อบทเรียน**: {lessonTopic}
**ระดับชั้น**: {level}

**ภารกิจ**: ค้นหาตัวชี้วัดที่เหมาะสมสำหรับการสอนเรื่อง "{lessonTopic}" ในกลุ่มสาระ{subject} ระดับชั้น {level}

**วิธีการวิเคราะห์**:
1. วิเคราะห์คำสำคัญในหัวข้อบทเรียนและกลุ่มสาระ
2. เลือก row ที่มีข้อมูลเกี่ยวข้องมากที่สุดกับระดับชั้นและเนื้อหา
3. ใช้ข้อมูลจาก row เดียวกันทั้งหมด (กลุ่มสาระ, มาตรฐาน, ตัวชี้วัด)
4. **หากใน row นั้นไม่มีตัวชี้วัดระหว่างทาง ให้ใส่ "ไม่ระบุ" ในฟิลด์นั้น**
5. **หากใน row นั้นไม่มีตัวชี้วัดปลายทาง ให้ใส่ "ไม่ระบุ" ในฟิลด์นั้น**

**รูปแบบ JSON ที่ต้องการ**:
{{
  "กลุ่มสาระการเรียนรู้": "ชื่อกลุ่มสาระจาก row ที่เลือก",
  "มาตรฐาน": "รหัสและชื่อมาตรฐานจาก row ที่เลือก", 
  "ตัวชี้วัดระหว่างทาง": "รหัสและรายละเอียดตัวชี้วัดระหว่างทางจาก row ที่เลือก หรือ 'ไม่ระบุ' หากไม่มี",
  "ตัวชี้วัดปลายทาง": "รหัสและรายละเอียดตัวชี้วัดปลายทางจาก row ที่เลือก หรือ 'ไม่ระบุ' หากไม่มี",
  "เหตุผลการเลือก": "อธิบายว่าทำไม row นี้เหมาะสมกับการสอนเรื่องนี้ในระดับชั้นนี้"
}}

**หมายเหตุสำคัญ**: 
- ต้องใช้ข้อมูลจาก row เดียวกันเท่านั้น
- หากใน row ไม่มีตัวชี้วัดใดตัวชี้วัดหนึ่ง ให้ตอบ "ไม่ระบุ" แทน
- ห้ามผสมข้อมูลจากหลาย row`,
  ],
]);

export async function callQueryLLM(subject: string, lessonTopic: string, level: string) {
  console.log("🔍 Calling Query LLM for curriculum search:");
  try {
    const chatModel = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.5,
      openAIApiKey: OPENAI_API_KEY,
    });

    // Retrieval and document chain process using similarity search only
    const detectedSubject = getSubjectCSVPath(subject);
    const lessonPlanGuidelinePath = detectedSubject;
    console.log(`📚 Querying subject: ${detectedSubject || 'general curriculum'}`);
    console.log(`📁 Using CSV file: ${lessonPlanGuidelinePath}`);
    
    const searchQuery = `กลุ่มสาระ: ${subject} เรื่อง: ${lessonTopic} ระดับชั้น: ${level}`;
    
    // Get vector store for the curriculum data
    const curriculumVectorStore = await docsQuery(lessonPlanGuidelinePath);
    // Use similarity search only
    console.log(`🔍 Using similarity search`);
    const curriculumDocs = await curriculumVectorStore.similaritySearch(searchQuery, 10);
    console.log(`📥 Retrieved ${curriculumDocs.length} relevant guideline docs`);
    
    // Use the 0_0 prompt template directly
    const prompt = prompt_0_0;
    const documentChain = await createStuffDocumentsChain({
      llm: chatModel,
      prompt,
    });
    
    const response = await documentChain.invoke({
      subject: subject,
      lessonTopic: lessonTopic,
      level: level,
      context: curriculumDocs,
    });
    
    console.log("✅ LLM response:", response);
    return response;
  } catch (error) {
    console.error("❌ LangChain/OpenAI Error:", error);
    throw new Error("Failed to get AI response");
  }
}
