import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { getRetrieverFrom } from "@/lib/retriever";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function callGenerateLLM(
  task: string,
  type: string,
  field: string,
  template: string
) {
  try {
    const lessonPlanGuidelinePath = "src/data/curriculumStandard2551.pdf";
    const lessonPlanGuidelineRetriever = await getRetrieverFrom(
      lessonPlanGuidelinePath
    );
    const lessonPlanGuidelineDocs =
      await lessonPlanGuidelineRetriever.getRelevantDocuments(task);
    console.log("📥 Retrieved relevant guideline docs");

    const chatModel = new ChatOpenAI({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      openAIApiKey: OPENAI_API_KEY,
    });
    // const lessonPlanPrompt = ChatPromptTemplate.fromMessages([
    //   [
    //     "system",
    //     `คุณคือผู้เชี่ยวชาญด้านการศึกษาและผู้ออกแบบแผนการสอน
    //     คุณต้องตอบคำถามเป็นภาษาไทยเท่านั้น และคำตอบต้องอยู่ในรูปแบบ {type}
    //     โดยไม่มีคำอธิบายเพิ่มเติมหรือข้อความอื่นใดนอกเหนือจากรูปแบบที่กำหนด`
    //   ],
    //   [
    //     "human",
    //     `จากข้อมูล guideline ต่อไปนี้:
    //     {context}

    //     และข้อมูลบริบท:
    //     {task}

    //     โปรดออกแบบหลักสูตรการเรียนรู้ในลักษณะห้องเรียนรวม (Inclusive Classroom) โดยคำตอบจะต้องอยู่ในรูปแบบ {type} และประกอบด้วย {field} โดยต้องมีคุณลักษณะสำคัญดังนี้:
    //     - เน้นการเรียนรู้ร่วมกันระหว่างผู้เรียนทุกกลุ่ม
    //     - ใช้หลัก Universal Design for Learning (UDL)
    //     - มีการส่งเสริมพฤติกรรมเชิงบวก (PBIS)
    //     - ใช้กลยุทธ์การสอนหลากหลาย เช่น Project-based Learning, Flipped Classroom, Peer-assisted Learning, Co-teaching และ Scaffolding
    //     - ประเมินผลหลากหลายรูปแบบ ทั้งรูปธรรม เชิงกระบวนการ และการถ่ายโอนการเรียนรู้
    //     - บูรณาการเทคโนโลยีช่วยเหลือและการปรับเนื้อหาให้เหมาะสมกับผู้เรียนที่มีความต้องการเฉพาะ
    //     - ส่งเสริมบรรยากาศห้องเรียนที่ปลอดภัยและสนับสนุนด้านอารมณ์
    //     - มีระบบความร่วมมือระหว่างครู ผู้ปกครอง และผู้เชี่ยวชาญ
    //     กรุณาระบุ:
    //     - ชื่อหลักสูตร
    //     - รายชื่อหน่วยการเรียนรู้
    //     - สมรรถนะหลักและสมรรถนะเฉพาะกลุ่มสาระที่เน้นในแต่ละหน่วย
    //     - ผลลัพธ์การเรียนรู้ที่คาดหวัง
    //     - กลยุทธ์และกิจกรรมการเรียนรู้ในแต่ละหน่วย
    //     - แนวทางการประเมิน
    //     - การสนับสนุนเฉพาะสำหรับผู้เรียนที่ต้องการการช่วยเหลือ
    //     `
    //   ]
    // ]);

    const documentChain = await createStuffDocumentsChain({
      llm: chatModel,
      prompt: getPrompt(template),
    });

    const response = await documentChain.invoke({
      task: task,
      type: type,
      field: field,
      context: lessonPlanGuidelineDocs,
      lessonPlanPrompt: getPrompt(template),
    });

    return response;
  } catch (error) {
    console.error("❌ LangChain/OpenAI Error:", error);
    throw new Error("Failed to get AI response");
  }
}

function getPrompt(template: string) {
  if (template == "generate") {
    return ChatPromptTemplate.fromMessages([
      [
        "system",
        `คุณคือผู้เชี่ยวชาญด้านการศึกษาและผู้ออกแบบแผนการสอน 
      คุณต้องตอบคำถามเป็นภาษาไทยเท่านั้น และคำตอบต้องอยู่ในรูปแบบ {type} 
      โดยไม่มีคำอธิบายเพิ่มเติมหรือข้อความอื่นใดนอกเหนือจากรูปแบบที่กำหนด`,
      ],
      [
        "human",
        `จากข้อมูล guideline ต่อไปนี้:
      {context}

      และข้อมูลบริบท:
      {task}

      โปรดออกแบบหลักสูตรการเรียนรู้ในลักษณะห้องเรียนรวม (Inclusive Classroom) โดยคำตอบจะต้องอยู่ในรูปแบบ {type} และประกอบด้วย {field} โดยถึงแม้ field จะเป็นภาษาอังกฤษ แต่คำตอบในแต่ละ field จะต้องเป็นภาษาไทย:
`,
      ],
    ]);
  }else if (template == "followup") {
    return ChatPromptTemplate.fromMessages([
      [
      "system",
      `คุณคือผู้เชี่ยวชาญด้านการศึกษาและการประเมินสะท้อนคิด 
      คุณต้องตอบคำถามเป็นภาษาไทยเท่านั้น และคำตอบต้องอยู่ในรูปแบบที่กระชับ ชัดเจน และมีข้อมูลเชิงลึก และคำตอบต้องอยู่ในรูปแบบ {type} `,
      ],
      [
      "human",
        `จากข้อมูล guideline ต่อไปนี้:
      {context}
      ให้คุณทำตามขั้นตอนต่อไปนี้: {task}
      จะต้องประกอบด้วย {field} 
      `,
      ],
    ]);
  }
}
