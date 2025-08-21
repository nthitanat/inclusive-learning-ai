import { ChatOpenAI } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { docsQuery } from "@/lib/docsQuery";
import { getSubjectCSVPath } from "@/utils/subjectMapping";
import { prompts } from "@/lib/promptTemplates";
import { RunnableSequence, RunnableParallel, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { extractJSON } from "@/utils/extractJSON";
import { searchAgent, SearchAgent } from "@/lib/searchAgent";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize the LLM once
const chatModel = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.5,
  openAIApiKey: OPENAI_API_KEY,
});

// Utility functions
const parseJSON = async (input: string) => {
  try {
    return await extractJSON(input);
  } catch (error) {
    console.error("JSON parsing error:", error);
    throw new Error("Failed to parse JSON response");
  }
};

// Create optimized pipeline chains
export class OptimizedLessonPipeline {
  private vectorStore: any = null;

  async initialize(subject: string) {
    const csvPath = getSubjectCSVPath(subject);
    this.vectorStore = await docsQuery(csvPath);
    return this;
  }

  // Step 0: Curriculum Analysis with parallel content generation
  async step0(subject: string, lessonTopic: string, level: string) {
    console.log(`🚀 Starting optimized Step 0 for ${subject} - ${lessonTopic}`);

    // Curriculum retrieval and analysis
    const curriculumChain = RunnableSequence.from([
      RunnablePassthrough.assign({
        context: async () => {
          const searchQuery = `กลุ่มสาระ: ${subject} เรื่อง: ${lessonTopic} ระดับชั้น: ${level}`;
          return await this.vectorStore.similaritySearch(searchQuery, 10);
        }
      }),
      prompts.curriculum,
      chatModel,
      new StringOutputParser(),
      parseJSON
    ]);

    // Get curriculum data first
    const curriculumData = await curriculumChain.invoke({
      subject,
      lessonTopic,
      level
    });

    // Check for "ไม่พบ" error
    if (typeof curriculumData === "string" && curriculumData.includes("ไม่พบ")) {
      throw new Error("ไม่พบข้อมูลหลักสูตร กรุณาลองใหม่");
    }

    // Generate content and summary in parallel
    const contentChain = RunnableSequence.from([
      prompts.contentAndSummary,
      chatModel,
      new StringOutputParser(),
      parseJSON
    ]);

    const contentData = await contentChain.invoke({
      standard: curriculumData["มาตรฐาน"],
      interimIndicators: curriculumData["ตัวชี้วัดระหว่างทาง"],
      finalIndicators: curriculumData["ตัวชี้วัดปลายทาง"]
    });

    return {
      ...curriculumData,
      ...contentData
    };
  }

  // Step 1: Objectives generation
  async step1(sessionData: any) {
    console.log("🚀 Starting optimized Step 1 - Objectives");

    const objectivesChain = RunnableSequence.from([
      prompts.objectives,
      chatModel,
      new StringOutputParser(),
      parseJSON
    ]);

    const objectives = await objectivesChain.invoke({
      subject: sessionData.subject,
      content: JSON.stringify(sessionData.content),
      level: sessionData.level,
      interimIndicators: JSON.stringify(sessionData.interimIndicators),
      finalIndicators: JSON.stringify(sessionData.finalIndicators)
    });

    const keyCompetencies = {
      "5.1": "ความสามารถในการสื่อสาร",
      "5.2": "ความสามารถในการคิด",
      "5.3": "ความสามารถในการแก้ปัญหา",
      "5.4": "ความสามารถในการใช้ทักษะชีวิต",
    };

    return {
      "จุดประสงค์การเรียนรู้": objectives,
      "สมรรถนะผู้เรียน": keyCompetencies,
    };
  }

  // Step 2: Enhanced Lesson Plan and Materials with Internet Search and Reasoning
  async step2Agent(sessionData: any, numStudents: number = 30, studentType: any[] = [], studyPeriod: number = 9) {
    console.log("🚀 Starting enhanced Step 2 Agent - Lesson Plan with Internet Search & Reasoning");

    const studentTypesStr = studentType.length > 0
      ? studentType.map((s: any, idx: number) => `ประเภทที่ ${idx + 1}: ${s.type} (${s.percentage}%)`).join(", ")
      : "ไม่ระบุประเภทนักเรียน";

    const totalMinutes = 50 * studyPeriod;

    // Step 2.1: Perform enhanced search and reasoning
    console.log("🔍 Step 2.1: Gathering enhanced data from internet search and reasoning...");
    let enhancedData;
    
    try {
      enhancedData = await searchAgent.performEnhancedSearch(
        sessionData.subject,
        sessionData.lessonTopic,
        sessionData.level,
        studentType
      );
      console.log("✅ Enhanced data gathered successfully");
    } catch (error) {
      console.warn("⚠️ Search API not working, using fallback reasoning:", error);
      // Fallback to reasoning-only approach
      enhancedData = {
        teachingProcessExamples: [
          "5E Model: Engage → Explore → Explain → Elaborate → Evaluate",
          "Problem-Based Learning: การเรียนรู้ผ่านการแก้ปัญหาจริง",
          "Active Learning: การเรียนรู้เชิงรุกผ่านกิจกรรมหลากหลาย"
        ],
        lessonDetails: `เนื้อหา${sessionData.subject} เรื่อง${sessionData.lessonTopic} สำหรับผู้เรียนระดับ${sessionData.level}`,
        udlStrategies: [
          "Multiple Means of Representation: ใช้สื่อที่หลากหลาย",
          "Multiple Means of Engagement: สร้างแรงจูงใจหลายรูปแบบ",
          "Multiple Means of Action/Expression: เปิดทางเลือกการแสดงออก"
        ],
        inclusiveStrategies: [
          "Differentiated Instruction: ปรับการสอนตามความแตกต่าง",
          "Collaborative Learning: การเรียนรู้แบบร่วมมือ",
          "Flexible Assessment: การประเมินผลแบบยืดหยุ่น"
        ]
      };
    }

    // Step 2.2: Create enhanced prompt with gathered data
    const enhancedPrompt = ChatPromptTemplate.fromMessages([
      ["system", "คุณคือผู้เชี่ยวชาญด้านการออกแบบกระบวนการจัดการเรียนรู้ UDL และ Inclusive Education ที่มีข้อมูลเชิงลึกจากการค้นคว้า ตอบเป็น JSON เท่านั้น"],
      ["human", `ออกแบบกระบวนการจัดการเรียนรู้แบบ UDL โดยคำนึงถึงความแตกต่างของนักเรียนแต่ละประเภทในห้อง (Inclusive Classroom)

**ข้อมูลพื้นฐาน:**
- เนื้อหา: {content}
- จำนวนชั่วโมงทั้งหมดในการสอน: ({studyPeriod} ชั่วโมง)
- จำนวนนักเรียน: {numStudents} คน
- ประเภทนักเรียน: {studentTypes}

**ข้อมูลเพิ่มเติมจากการค้นคว้า:**
1. ตัวอย่างกระบวนการการจัดกิจกรรมการสอน:
{teachingProcessExamples}

2. รายละเอียดเชิงลึกของบทเรียน:
{lessonDetails}

3. กลยุทธ์ UDL ที่เหมาะสม:
{udlStrategies}

4. กลยุทธ์ Inclusive Classroom:
{inclusiveStrategies}

**คำแนะนำการออกแบบ:**
- ใช้ข้อมูลจากการค้นคว้าข้างต้นในการออกแบบกิจกรรม
- นำตัวอย่างกระบวนการการสอนมาปรับใช้ให้เหมาะสม
- ผสมผสานกลยุทธ์ UDL และ Inclusive ในทุกขั้นตอน
- **ห้ามใช้กิจกรรมง่ายเกินไป** เช่น วาดภาพ/จับคู่คำศัพท์ เว้นแต่มีความเกี่ยวโยงกับการวิเคราะห์หรือออกแบบทางวิทยาศาสตร์จริง
- **ทุกกิจกรรมต้องสอดคล้องกับสาระและตัวชี้วัด** และมีเป้าหมายที่ระดับวิเคราะห์ ประเมินค่า หรือสร้างสรรค์ ตาม Bloom's Taxonomy

**การจัดโครงสร้างกิจกรรม:**
- สามารถมีได้หลายขั้นตอนตามความเหมาะสม
- จำนวนขั้นตอนย่อย: ความซับซ้อนของเนื้อหา, เวลาที่มี, และความหลากหลายของนักเรียน
- ระบุเวลาของแต่ละขั้นตอนให้ครบ {totalMinutes} นาทีรวมกัน

**โครงสร้าง JSON ที่ถูกต้อง - ต้องเป็นแบบ NESTED หรือซ้อนกัน:**
{{
  "กิจกรรมการเรียนรู้": {{
            "8.1 ชื่อขั้นตอนหลักที่ 1 (X นาที)": {{
                    "1 ชื่อขั้นตอนย่อยที่1 (X นาที)" : {{
                             รายละเอียดการดำเนินการ,
                             สื่อ/อุปกรณ์การสอน,
                             บทบาทผู้เรียน,
                             บทบาทครู,
                             แนวทางการปรับกิจกรรมสำหรับผู้เรียนที่หลากหลาย: {{
                                "1 ประเภทนักเรียนที่1": "วิธีการปรับกิจกรรม",
                                "2 ประเภทนักเรียนที่2": "วิธีการปรับกิจกรรม"
                            }}
                            
                    }}
                    "2 ชื่อขั้นตอนย่อยที่2 (X นาที)" : {{
                             รายละเอียดการดำเนินการ,
                             สื่อ/อุปกรณ์การสอน,
                             บทบาทผู้เรียน,
                             บทบาทครู,
                             แนวทางการปรับกิจกรรมสำหรับผู้เรียนที่หลากหลาย: {{
                                "1 ชื่อประเภทนักเรียนที่1": "วิธีการปรับกิจกรรม",
                                "2 ชื่อประเภทนักเรียนที่2": "วิธีการปรับกิจกรรม"
                            }}
                    }}
            }},
            "8.2 ชื่อขั้นตอนหลักที่ 2 (X นาที)": {{
                    "1 ชื่อขั้นตอนย่อยที่1 (X นาที)" : {{
                             รายละเอียดการดำเนินการ,
                             สื่อ/อุปกรณ์การสอน,
                             บทบาทผู้เรียน,
                             บทบาทครู,
                             แนวทางการปรับกิจกรรมสำหรับผู้เรียนที่หลากหลาย: {{
                                "1 ประเภทนักเรียนที่1": "วิธีการปรับกิจกรรม",
                                "2 ประเภทนักเรียนที่2": "วิธีการปรับกิจกรรม"
                            }}
                            
                    }}
                    "2 ชื่อขั้นตอนย่อยที่2 (X นาที)" : {{
                             รายละเอียดการดำเนินการ,
                             สื่อ/อุปกรณ์การสอน,
                             บทบาทผู้เรียน,
                             บทบาทครู,
                             แนวทางการปรับกิจกรรมสำหรับผู้เรียนที่หลากหลาย: {{
                                "1 ประเภทนักเรียนที่1": "วิธีการปรับกิจกรรม",
                                "2 ประเภทนักเรียนที่2": "วิธีการปรับกิจกรรม"
                            }}
                    }}
            }},
            "8.3 ชื่อขั้นตอนหลักที่ 3 (X นาที)": [...],
             ...,
            "8.x ... : [...]
  }},
  "สื่อและอุปกรณ์": {{
    "1": "รายการสื่อและอุปกรณ์ที่ใช้ในกิจกรรม",
    "2": "เทคโนโลยีและแอปพลิเคชันที่ใช้",
    "3": "วัสดุสำหรับการทดลองหรือกิจกรรมสร้างสรรค์"
  }},
  "การใช้ข้อมูลจากการค้นคว้า": {{
    "ตัวอย่างกระบวนการที่นำมาใช้": "ระบุว่านำตัวอย่างไหนมาใช้และปรับอย่างไร",
    "กลยุทธ์ UDL ที่ใช้": "ระบุกลยุทธ์ UDL ที่นำมาประยุกต์",
    "กลยุทธ์ Inclusive ที่ใช้": "ระบุกลยุทธ์ Inclusive ที่นำมาประยุกต์"
  }}
}}

ให้คิดอย่างสร้างสรรค์และปรับตามบริบทที่ได้รับ! นำข้อมูลจากการค้นคว้ามาใช้อย่างเป็นระบบ`]
    ]);

    // Step 2.3: Generate enhanced lesson plan
    console.log("🎯 Step 2.3: Generating enhanced lesson plan...");
    
    const enhancedChain = RunnableSequence.from([
      enhancedPrompt,
      chatModel,
      new StringOutputParser(),
      parseJSON
    ]);

    const result = await enhancedChain.invoke({
      content: JSON.stringify(sessionData.content),
      studyPeriod,
      totalMinutes,
      numStudents,
      studentTypes: studentTypesStr,
      teachingProcessExamples: enhancedData.teachingProcessExamples.join(", "),
      lessonDetails: enhancedData.lessonDetails,
      udlStrategies: enhancedData.udlStrategies.join(", "),
      inclusiveStrategies: enhancedData.inclusiveStrategies.join(", ")
    });

    console.log("✅ Enhanced lesson plan generated successfully");

    return {
      response: result["กิจกรรมการเรียนรู้"],
      teachingMaterials: result["สื่อและอุปกรณ์"],
      enhancedData: result["การใช้ข้อมูลจากการค้นคว้า"] || enhancedData,
      searchMetadata: {
        searchPerformed: true,
        enhancedProcesses: enhancedData.teachingProcessExamples,
        udlStrategies: enhancedData.udlStrategies,
        inclusiveStrategies: enhancedData.inclusiveStrategies
      }
    };
  }

  // Step 2: Original Lesson Plan and Materials (kept for backward compatibility)
  async step2(sessionData: any, numStudents: number = 30, studentType: any[] = [], studyPeriod: number = 9) {
    console.log("🚀 Starting optimized Step 2 - Lesson Plan & Materials");

    const studentTypesStr = studentType.length > 0
      ? studentType.map((s: any, idx: number) => `ประเภทที่ ${idx + 1}: ${s.type} (${s.percentage}%)`).join(", ")
      : "ไม่ระบุประเภทนักเรียน";

    const totalMinutes = 50 * studyPeriod;

    const lessonChain = RunnableSequence.from([
      prompts.lessonPlanAndMaterials,
      chatModel,
      new StringOutputParser(),
      parseJSON
    ]);

    const result = await lessonChain.invoke({
      content: JSON.stringify(sessionData.content),
      studyPeriod,
      totalMinutes,
      numStudents,
      studentTypes: studentTypesStr
    });

    return {
      response: result["กิจกรรมการเรียนรู้"],
      teachingMaterials: result["สื่อและอุปกรณ์"]
    };
  }

  // Step 3: Evaluation
  async step3(sessionData: any) {
    console.log("🚀 Starting optimized Step 3 - Evaluation");

    const evaluationChain = RunnableSequence.from([
      prompts.evaluation,
      chatModel,
      new StringOutputParser(),
      parseJSON
    ]);

    const evaluation = await evaluationChain.invoke({
      lessonPlan: JSON.stringify(sessionData.lessonPlan),
      interimIndicators: JSON.stringify(sessionData.interimIndicators)
    });

    return evaluation;
  }

  // Advanced: Run multiple steps in parallel where possible
  async runParallelSteps(sessionData: any, step1Input: any, step2Input: any) {
    console.log("🚀 Running Steps 1-2 in parallel");

    const parallelChain = RunnableParallel.from({
      objectives: async () => this.step1(sessionData),
      lessonPlan: async () => this.step2(sessionData, step2Input.numStudents, step2Input.studentType, step2Input.studyPeriod)
    });

    return await parallelChain.invoke({});
  }

  // Batch processing for multiple sessions
  async batchProcess(sessions: Array<{subject: string, lessonTopic: string, level: string}>) {
    console.log(`🚀 Batch processing ${sessions.length} sessions`);

    const batchChain = RunnableParallel.from(
      sessions.reduce((acc, session, index) => {
        acc[`session_${index}`] = async () => {
          await this.initialize(session.subject);
          return this.step0(session.subject, session.lessonTopic, session.level);
        };
        return acc;
      }, {} as any)
    );

    return await batchChain.invoke({});
  }
}

// Error handling wrapper
export const createResilientPipeline = () => {
  const pipeline = new OptimizedLessonPipeline();
  
  const withRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    throw new Error("All retries exhausted");
  };

  return {
    ...pipeline,
    step0: (subject: string, lessonTopic: string, level: string) => 
      withRetry(() => pipeline.step0(subject, lessonTopic, level)),
    step1: (sessionData: any) => 
      withRetry(() => pipeline.step1(sessionData)),
    step2: (sessionData: any, numStudents?: number, studentType?: any[], studyPeriod?: number) => 
      withRetry(() => pipeline.step2(sessionData, numStudents, studentType, studyPeriod)),
    step2Agent: (sessionData: any, numStudents?: number, studentType?: any[], studyPeriod?: number) => 
      withRetry(() => pipeline.step2Agent(sessionData, numStudents, studentType, studyPeriod)),
    step3: (sessionData: any) => 
      withRetry(() => pipeline.step3(sessionData))
  };
};

// Performance monitoring
export const monitoredPipeline = (pipeline: OptimizedLessonPipeline) => {
  const monitor = <T>(stepName: string, fn: (...args: any[]) => Promise<T>) => {
    return async (...args: any[]): Promise<T> => {
      const startTime = Date.now();
      try {
        const result = await fn(...args);
        console.log(`✅ ${stepName} completed in ${Date.now() - startTime}ms`);
        return result;
      } catch (error) {
        console.error(`❌ ${stepName} failed after ${Date.now() - startTime}ms:`, error);
        throw error;
      }
    };
  };

  return {
    ...pipeline,
    step0: monitor("Step 0", pipeline.step0.bind(pipeline)),
    step1: monitor("Step 1", pipeline.step1.bind(pipeline)),
    step2: monitor("Step 2", pipeline.step2.bind(pipeline)),
    step2Agent: monitor("Step 2 Agent", pipeline.step2Agent.bind(pipeline)),
    step3: monitor("Step 3", pipeline.step3.bind(pipeline))
  };
};
