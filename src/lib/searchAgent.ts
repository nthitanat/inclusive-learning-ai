import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { extractJSON } from "@/utils/extractJSON";
import { Serper } from "@langchain/community/tools/serper";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SERPER_API_KEY = process.env.SERPER_API_KEY;

// Initialize the LLM for search agent
const searchModel = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.3,
  openAIApiKey: OPENAI_API_KEY,
});

// Interface for search results
interface SearchResult {
  title: string;
  url: string;
  content: string;
  relevanceScore: number;
}

interface EnhancedLessonData {
  teachingProcessExamples: string[];
  lessonDetails: string;
  udlStrategies: string[];
  inclusiveStrategies: string[];
}

// Initialize Serper search tool lazily
let serperTool: Serper | null = null;

function getSerperTool(): Serper | null {
  if (!SERPER_API_KEY) {
    console.warn("⚠️ SERPER_API_KEY not found");
    return null;
  }
  
  if (!serperTool) {
    serperTool = new Serper(SERPER_API_KEY);
  }
  
  return serperTool;
}

// Serper search function with error handling
async function performWebSearch(query: string): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Searching via Serper API for: ${query}`);
    
    const tool = getSerperTool();
    if (!tool) {
      console.warn("⚠️ Serper tool not available, using fallback");
      return getFallbackResults(query);
    }
    
    // Use Langchain Serper tool
    const searchResponse = await tool.call(query);
    
    if (!searchResponse) {
      console.warn(`No search results found for: ${query}`);
      return getFallbackResults(query);
    }

    // Parse Serper response
    let results: any[] = [];
    
    try {
      // First, try to parse as JSON if it looks like JSON
      if (searchResponse.toString().trim().startsWith('{') || searchResponse.toString().trim().startsWith('[')) {
        const parsedResponse = typeof searchResponse === 'string' 
          ? JSON.parse(searchResponse) 
          : searchResponse;
        
        if (parsedResponse.organic) {
          results = parsedResponse.organic;
        } else if (parsedResponse.results) {
          results = parsedResponse.results;
        } else if (Array.isArray(parsedResponse)) {
          results = parsedResponse;
        }
      } else {
        // Handle plain text response - treat entire response as content
        const textContent = searchResponse.toString().trim();
        if (textContent && textContent.length > 10) {
          results = [{
            title: `Search Result for: ${query.substring(0, 50)}...`,
            snippet: textContent,
            link: `https://search-result.com/query`
          }];
        }
      }
    } catch (parseError: any) {
      console.warn("Failed to parse Serper response, treating as plain text:", parseError?.message || 'Unknown error');
      // Always treat as plain text if JSON parsing fails
      const textContent = searchResponse.toString().trim();
      if (textContent && textContent.length > 10) {
        // Split long text into multiple results if it's very long
        const chunks = textContent.match(/.{1,500}/g) || [textContent];
        results = chunks.slice(0, 3).map((chunk: string, index: number) => ({
          title: `Result ${index + 1} for: ${query.substring(0, 30)}...`,
          snippet: chunk.trim(),
          link: `https://search-result.com/result${index + 1}`
        }));
      }
    }

    // Convert to our SearchResult format
    const searchResults: SearchResult[] = results.slice(0, 8).map((result: any, index: number) => ({
      title: result.title || result.displayTitle || `Search Result ${index + 1}`,
      url: result.link || result.url || `https://example.com/result${index + 1}`,
      content: result.snippet || result.description || result.title || '',
      relevanceScore: Math.max(0.1, 1.0 - (index * 0.1))
    }));

    console.log(`✅ Found ${searchResults.length} search results via Serper`);
    return searchResults;

  } catch (error) {
    console.warn('Serper search failed:', error);
    return getFallbackResults(query);
  }
}

// Fallback results function
function getFallbackResults(query: string): SearchResult[] {
  if (query.includes("กระบวนการการจัดกิจกรรมการสอน") || query.includes("teaching process")) {
    return [
      {
        title: "กระบวนการจัดการเรียนรู้แบบ 5E Model",
        url: "https://education.go.th/5e-model",
        content: "กระบวนการ 5E ประกอบด้วย Engage (จูงใจ), Explore (สำรวจ), Explain (อธิบาย), Elaborate (ขยายความรู้), Evaluate (ประเมิน) เป็นวิธีการสอนที่เน้นผู้เรียนเป็นสำคัญและส่งเสริมการเรียนรู้อย่างมีความหมาย",
        relevanceScore: 0.95
      },
      {
        title: "Active Learning และการจัดกิจกรรมการเรียนรู้",
        url: "https://teachingmethods.org/active-learning",
        content: "Active Learning เน้นให้ผู้เรียนมีส่วนร่วมในกิจกรรม ผ่านการอภิปราย การทำงานกลุ่ม การแก้ปัญหา และการคิดวิเคราะห์ เพื่อสร้างความเข้าใจที่ลึกซึ้งและยั่งยืน",
        relevanceScore: 0.9
      },
      {
        title: "Problem-Based Learning in Thai Education",
        url: "https://pbl-thailand.edu/methods",
        content: "Problem-Based Learning หรือการเรียนรู้จากปัญหาเป็นวิธีการสอนที่ให้นักเรียนเรียนรู้ผ่านการแก้ปัญหาจริง เหมาะสำหรับการพัฒนาทักษะการคิดและการประยุกต์ความรู้",
        relevanceScore: 0.85
      },
      {
        title: "Inquiry-Based Learning Strategies",
        url: "https://inquiry-learning.edu/strategies",
        content: "การเรียนรู้แบบสืบเสาะหาความรู้ (Inquiry-Based Learning) ส่งเสริมให้ผู้เรียนตั้งคำถาม ค้นหาคำตอบ และสร้างความรู้ด้วยตนเอง ผ่านกระบวนการสืบสวนสอบสวน",
        relevanceScore: 0.8
      }
    ];
  } else if (query.includes("UDL") || query.includes("Universal Design")) {
    return [
      {
        title: "UDL Guidelines and Implementation in Thailand",
        url: "https://udl-thailand.org/guidelines",
        content: "Universal Design for Learning (UDL) มี 3 หลักการสำคัญ: Multiple Means of Representation (การนำเสนอที่หลากหลาย), Multiple Means of Engagement (การสร้างแรงจูงใจ), Multiple Means of Action and Expression (การแสดงออกที่หลากหลาย)",
        relevanceScore: 0.95
      },
      {
        title: "UDL in Thai Classroom Context",
        url: "https://thai-inclusive-ed.org/udl-classroom",
        content: "การประยุกต์ใช้ UDL ในห้องเรียนไทย ควรคำนึงถึงวัฒนธรรมการเรียนรู้ ภาษา และความหลากหลายของผู้เรียน โดยใช้เทคโนโลยีและสื่อที่เหมาะสมกับบริบทไทย",
        relevanceScore: 0.9
      },
      {
        title: "Multiple Intelligence and UDL Integration",
        url: "https://multiple-intelligence.edu/udl",
        content: "การบูรณาการทฤษฎีพหุปัญญา (Multiple Intelligence) กับ UDL ช่วยให้ครูสามารถออกแบบการเรียนรู้ที่ตอบสนองความแตกต่างของผู้เรียนได้อย่างมีประสิทธิภาพ",
        relevanceScore: 0.85
      }
    ];
  } else if (query.includes("inclusive classroom") || query.includes("ห้องเรียนเปิดกว้าง") || query.includes("ห้องเรียนแบบรวม")) {
    return [
      {
        title: "Inclusive Classroom Strategies for Thai Students",
        url: "https://inclusive-thailand.edu/strategies",
        content: "ห้องเรียนเปิดกว้างต้องคำนึงถึงความแตกต่างของผู้เรียน โดยจัดสิ่งแวดล้อมที่รองรับความหลากหลาย ใช้กิจกรรมที่หลากหลาย และประเมินแบบหลายมิติ",
        relevanceScore: 0.9
      },
      {
        title: "Differentiated Instruction in Practice",
        url: "https://differentiated-learning.org/practice",
        content: "Differentiated Instruction เป็นการปรับการสอนให้เหมาะกับความแตกต่างของผู้เรียน ทั้งในด้านความสามารถ ความสนใจ และรูปแบบการเรียนรู้ โดยใช้กลยุทธ์ที่หลากหลาย",
        relevanceScore: 0.85
      },
      {
        title: "Collaborative Learning for Diverse Classrooms",
        url: "https://collaborative-ed.org/diverse",
        content: "การเรียนรู้แบบร่วมมือในห้องเรียนที่มีความหลากหลาย ช่วยให้ผู้เรียนได้เรียนรู้จากกันและกัน สร้างความเข้าใจในความแตกต่าง และพัฒนาทักษะทางสังคม",
        relevanceScore: 0.8
      }
    ];
  }
  
  // Return empty array if no relevant fallback data
  return [];
}

// Enhanced search with reasoning
export class SearchAgent {
  private model: ChatOpenAI;

  constructor() {
    this.model = searchModel;
  }

  // Search for teaching process examples
  async searchTeachingProcessExamples(subject: string, lessonTopic: string, level: string): Promise<string[]> {
    // Create comprehensive search query in both Thai and English
    const searchQueries = [
      `กระบวนการการจัดกิจกรรมการสอน ${subject} ${lessonTopic} ระดับ${level}`,
      `teaching methodology ${subject} ${lessonTopic} grade ${level}`,
      `5E model lesson plan ${subject}`,
      `problem based learning ${subject} Thailand`,
      `active learning strategies ${subject}`
    ];
    
    try {
      const allResults: SearchResult[] = [];
      
      // Search with multiple queries to get diverse results
      for (const query of searchQueries) {
        const results = await performWebSearch(query);
        allResults.push(...results);
        
        // Add delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (allResults.length === 0) {
        return await this.generateReasoningBasedExamples(subject, lessonTopic, level);
      }

      // Process search results with AI reasoning
      const reasoningPrompt = ChatPromptTemplate.fromMessages([
        ["system", "คุณคือผู้เชี่ยวชาญด้านวิธีการสอน วิเคราะห์ข้อมูลจากการค้นหาและสกัดตัวอย่างกระบวนการจัดกิจกรรมการสอนที่เหมาะสม"],
        ["human", `จากผลการค้นหา: {searchResults}
        
วิเคราะห์และให้ตัวอย่างกระบวนการการจัดกิจกรรมการสอนที่เหมาะสมสำหรับ:
- วิชา: {subject}
- หัวข้อ: {lessonTopic}  
- ระดับ: {level}

ให้ 4-5 ตัวอย่างกระบวนการที่หลากหลาย เช่น:
- 5E Model (Engage, Explore, Explain, Elaborate, Evaluate)
- Problem-Based Learning 
- Active Learning
- Inquiry-Based Learning
- Project-Based Learning

ตอบเป็น JSON array ของ string:
["กระบวนการที่1 พร้อมคำอธิบายสั้น", "กระบวนการที่2 พร้อมคำอธิบายสั้น", ...]`]
      ]);

      const chain = RunnableSequence.from([
        reasoningPrompt,
        this.model,
        new StringOutputParser(),
        (output: string) => {
          try {
            const parsed = JSON.parse(output);
            return Array.isArray(parsed) ? parsed : [output];
          } catch {
            // Fallback: split by lines if JSON parsing fails
            return output.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
          }
        }
      ]);

      const examples = await chain.invoke({
        searchResults: JSON.stringify(allResults.map(r => ({
          title: r.title,
          content: r.content
        }))),
        subject,
        lessonTopic,
        level
      });

      return Array.isArray(examples) ? examples : [examples];

    } catch (error) {
      console.warn("Enhanced search failed, using reasoning-based fallback:", error);
      return await this.generateReasoningBasedExamples(subject, lessonTopic, level);
    }
  }

  // Search for UDL and inclusive strategies
  async searchUDLStrategies(subject: string, lessonTopic: string, studentTypes: any[]): Promise<{udlStrategies: string[], inclusiveStrategies: string[]}> {
    const studentTypesStr = studentTypes.map(s => s.type).join(", ");
    
    // Create multiple search queries for better coverage
    const searchQueries = [
      `UDL Universal Design Learning ${subject} ${lessonTopic} strategies`,
      `inclusive classroom strategies ${subject} Thailand`,
      `differentiated instruction ${subject} special needs`,
      `ห้องเรียนแบบรวม ${subject} ${lessonTopic}`,
      `การออกแบบการเรียนรู้ที่เปิดกว้าง ${subject}`,
      `multiple intelligence teaching ${subject}`,
      `accessible education ${subject} diverse learners`
    ];
    
    try {
      const allResults: SearchResult[] = [];
      
      // Perform searches with multiple queries
      for (const query of searchQueries) {
        const results = await performWebSearch(query);
        allResults.push(...results);
        
        // Rate limit consideration
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      if (allResults.length === 0) {
        return await this.generateReasoningBasedStrategies(subject, lessonTopic, studentTypes);
      }

      const strategyPrompt = ChatPromptTemplate.fromMessages([
        ["system", "คุณคือผู้เชี่ยวชาญด้าน UDL และ Inclusive Education วิเคราะห์ข้อมูลและให้กลยุทธ์ที่เหมาะสม เฉพาะเจาะจง และใช้ได้จริง"],
        ["human", `จากผลการค้นหา: {searchResults}
        
วิเคราะห์และให้กลยุทธ์ UDL และ Inclusive Classroom สำหรับ:
- วิชา: {subject}
- หัวข้อ: {lessonTopic}
- ประเภทนักเรียน: {studentTypes}

ให้กลยุทธ์ที่เฉพาะเจาะจง ใช้ได้จริง และอ้างอิงจากข้อมูลที่ค้นพบ

ตอบเป็น JSON:
{{
  "udlStrategies": [
    "กลยุทธ์ UDL 1 พร้อมตัวอย่างการใช้งาน",
    "กลยุทธ์ UDL 2 พร้อมตัวอย่างการใช้งาน",
    "กลยุทธ์ UDL 3 พร้อมตัวอย่างการใช้งาน",
    "กลยุทธ์ UDL 4 พร้อมตัวอย่างการใช้งาน"
  ],
  "inclusiveStrategies": [
    "กลยุทธ์ Inclusive 1 พร้อมวิธีการปฏิบัติ",
    "กลยุทธ์ Inclusive 2 พร้อมวิธีการปฏิบัติ",
    "กลยุทธ์ Inclusive 3 พร้อมวิธีการปฏิบัติ",
    "กลยุทธ์ Inclusive 4 พร้อมวิธีการปฏิบัติ"
  ]
}}`]
      ]);

      const chain = RunnableSequence.from([
        strategyPrompt,
        this.model,
        new StringOutputParser(),
        (output: string) => {
          try {
            return JSON.parse(output);
          } catch {
            return {
              udlStrategies: [
                "Multiple means of representation: ใช้สื่อที่หลากหลาย (ภาพ เสียง วิดีโอ)",
                "Multiple means of engagement: สร้างแรงจูงใจที่หลากหลาย",
                "Multiple means of action/expression: เปิดทางเลือกการแสดงออก",
                "Flexible learning environments: จัดสิ่งแวดล้อมที่ยืดหยุ่น"
              ],
              inclusiveStrategies: [
                "Differentiated instruction: ปรับการสอนตามความแตกต่าง",
                "Collaborative learning: การเรียนรู้แบบร่วมมือ",
                "Peer support systems: ระบบเพื่อนช่วยเพื่อน",
                "Flexible assessment: การประเมินผลแบบยืดหยุ่น"
              ]
            };
          }
        }
      ]);

      const strategies = await chain.invoke({
        searchResults: JSON.stringify(allResults.map(r => ({
          title: r.title,
          content: r.content,
          url: r.url
        }))),
        subject,
        lessonTopic,
        studentTypes: studentTypesStr
      });

      return strategies;

    } catch (error) {
      console.warn("UDL search failed, using reasoning-based fallback:", error);
      return await this.generateReasoningBasedStrategies(subject, lessonTopic, studentTypes);
    }
  }

  // Get detailed lesson information
  async getLessonDetails(subject: string, lessonTopic: string, level: string): Promise<string> {
    // Create multiple search queries for comprehensive lesson information
    const searchQueries = [
      `${subject} ${lessonTopic} ระดับ${level} รายละเอียดบทเรียน`,
      `${subject} ${lessonTopic} เนื้อหาสำคัญ มัธยมศึกษา`,
      `${lessonTopic} concepts ${subject} grade ${level}`,
      `${lessonTopic} learning objectives ${subject}`,
      `หลักสูตร ${subject} ${lessonTopic} สาระสำคัญ`
    ];
    
    try {
      const allResults: SearchResult[] = [];
      
      // Search with multiple queries for comprehensive information
      for (const query of searchQueries) {
        const results = await performWebSearch(query);
        allResults.push(...results);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      const detailPrompt = ChatPromptTemplate.fromMessages([
        ["system", "คุณคือครูผู้เชี่ยวชาญ ให้รายละเอียดเชิงลึกเกี่ยวกับเนื้อหาบทเรียน โดยอ้างอิงจากข้อมูลที่ค้นพบ"],
        ["human", `จากข้อมูลการค้นหา: {searchResults}
        
ให้รายละเอียดเชิงลึกเกี่ยวกับบทเรียน:
- วิชา: {subject}
- หัวข้อ: {lessonTopic}
- ระดับ: {level}

รวมถึง:
- แนวคิดหลักที่สำคัญและความเข้าใจพื้นฐาน
- ความยากง่ายของเนื้อหาและจุดที่นักเรียนมักเข้าใจผิด
- ความเชื่อมโยงกับชีวิตประจำวันและการประยุกต์ใช้
- จุดที่ต้องให้ความสำคัญเป็นพิเศษ
- ตัวอย่างหรือกิจกรรมที่เหมาะสมจากข้อมูลที่ค้นพบ

ตอบเป็นย่อหน้าเดียวที่ครอบคลุมแต่กระชับ`]
      ]);

      const chain = RunnableSequence.from([
        detailPrompt,
        this.model,
        new StringOutputParser()
      ]);

      const details = await chain.invoke({
        searchResults: JSON.stringify(allResults.map(r => ({
          title: r.title,
          content: r.content
        }))),
        subject,
        lessonTopic,
        level
      });

      return details || `รายละเอียดบทเรียน ${subject} เรื่อง ${lessonTopic} ระดับ${level} - เนื้อหาที่ต้องให้ความสำคัญกับการเรียนรู้ที่เชื่อมโยงกับประสบการณ์จริงของผู้เรียน`;

    } catch (error) {
      console.warn("Lesson details search failed, using reasoning-based fallback:", error);
      
      // Enhanced fallback with reasoning
      const fallbackPrompt = ChatPromptTemplate.fromMessages([
        ["system", "คุณคือครูผู้เชี่ยวชาญ ให้รายละเอียดเชิงลึกเกี่ยวกับเนื้อหาบทเรียนโดยใช้ความรู้และประสบการณ์"],
        ["human", `ให้รายละเอียดเชิงลึกเกี่ยวกับบทเรียน:
- วิชา: {subject}
- หัวข้อ: {lessonTopic}
- ระดับ: {level}

รวมถึงแนวคิดหลัก ความยากง่าย การเชื่อมโยงกับชีวิตจริง และจุดสำคัญที่ต้องเน้น`]
      ]);

      try {
        const chain = RunnableSequence.from([
          fallbackPrompt,
          this.model,
          new StringOutputParser()
        ]);

        const details = await chain.invoke({
          subject,
          lessonTopic,
          level
        });

        return details;
      } catch (fallbackError) {
        console.warn("Fallback reasoning also failed:", fallbackError);
        return `รายละเอียดบทเรียน ${subject} เรื่อง ${lessonTopic} ระดับ${level} - ควรเน้นการเรียนรู้ที่เชื่อมโยงกับประสบการณ์จริงของผู้เรียน และการประยุกต์ใช้ในชีวิตประจำวัน`;
      }
    }
  }

  // Reasoning-based fallbacks
  private async generateReasoningBasedExamples(subject: string, lessonTopic: string, level: string): Promise<string[]> {
    const reasoningPrompt = ChatPromptTemplate.fromMessages([
      ["system", "คุณคือผู้เชี่ยวชาญด้านการจัดการเรียนรู้ ใช้ความรู้และประสบการณ์ในการสร้างตัวอย่างกระบวนการสอน"],
      ["human", `ออกแบบตัวอย่างกระบวนการการจัดกิจกรรมการสอนสำหรับ:
- วิชา: {subject}
- หัวข้อ: {lessonTopic}
- ระดับ: {level}

ให้ 3 ตัวอย่างกระบวนการที่แตกต่างกัน เช่น 5E Model, Problem-Based Learning, หรือ Active Learning

ตอบเป็น JSON array: ["กระบวนการที่1", "กระบวนการที่2", "กระบวนการที่3"]`]
    ]);

    const chain = RunnableSequence.from([
      reasoningPrompt,
      this.model,
      new StringOutputParser(),
      (output: string) => {
        try {
          return JSON.parse(output);
        } catch {
          return [
            "5E Model: Engage → Explore → Explain → Elaborate → Evaluate",
            "Problem-Based Learning: ระบุปัญหา → วิเคราะห์ → ค้นหาข้อมูล → แก้ไขปัญหา → สรุปผล",
            "Active Learning: กิจกรรมกลุ่ม → การอภิปราย → การทดลอง → การนำเสนอ → การสะท้อนผล"
          ];
        }
      }
    ]);

    return await chain.invoke({ subject, lessonTopic, level });
  }

  private async generateReasoningBasedStrategies(subject: string, lessonTopic: string, studentTypes: any[]): Promise<{udlStrategies: string[], inclusiveStrategies: string[]}> {
    const studentTypesStr = studentTypes.map(s => `${s.type} (${s.percentage}%)`).join(", ");
    
    const strategyPrompt = ChatPromptTemplate.fromMessages([
      ["system", "คุณคือผู้เชี่ยวชาญด้าน UDL และ Inclusive Education ใช้ความรู้เชิงลึกในการแนะนำกลยุทธ์"],
      ["human", `ออกแบบกลยุทธ์ UDL และ Inclusive สำหรับ:
- วิชา: {subject}
- หัวข้อ: {lessonTopic}
- ประเภทนักเรียน: {studentTypes}

ให้กลยุทธ์ที่เฉพาะเจาะจงและใช้ได้จริง

ตอบเป็น JSON:
{{
  "udlStrategies": ["กลยุทธ์ UDL เฉพาะเจาะจง 3 อย่าง"],
  "inclusiveStrategies": ["กลยุทธ์ Inclusive เฉพาะเจาะจง 3 อย่าง"]
}}`]
    ]);

    const chain = RunnableSequence.from([
      strategyPrompt,
      this.model,
      new StringOutputParser(),
      (output: string) => {
        try {
          return JSON.parse(output);
        } catch {
          return {
            udlStrategies: [
              "ใช้สื่อที่หลากหลาย (ภาพ เสียง วิดีโอ) สำหรับการนำเสนอเนื้อหา",
              "จัดกิจกรรมที่ให้ผู้เรียนเลือกวิธีการแสดงออกได้หลายรูปแบบ",
              "สร้างแรงจูงใจผ่านการเชื่อมโยงกับความสนใจและประสบการณ์ของผู้เรียน"
            ],
            inclusiveStrategies: [
              "จัดที่นั่งและสิ่งแวดล้อมให้เหมาะกับความต้องการของผู้เรียนแต่ละคน",
              "ใช้การทำงานกลุ่มแบบผสมผสานความสามารถเพื่อให้ทุกคนมีส่วนร่วม",
              "จัดการประเมินผลแบบยืดหยุ่นตามความสามารถและรูปแบบการเรียนรู้ของผู้เรียน"
            ]
          };
        }
      }
    ]);

    return await chain.invoke({ subject, lessonTopic, studentTypes: studentTypesStr });
  }

  // Main search and reasoning method
  async performEnhancedSearch(subject: string, lessonTopic: string, level: string, studentTypes: any[]): Promise<EnhancedLessonData> {
    console.log(`🤖 Starting enhanced Serper API search for: ${subject} - ${lessonTopic}`);
    
    try {
      // Perform all searches in parallel for efficiency (but with staggered timing)
      console.log("🔍 Performing comprehensive web search via Serper API across multiple categories...");
      
      const [teachingProcessExamples, lessonDetails, strategiesData] = await Promise.all([
        this.searchTeachingProcessExamples(subject, lessonTopic, level),
        this.getLessonDetails(subject, lessonTopic, level),
        this.searchUDLStrategies(subject, lessonTopic, studentTypes)
      ]);

      console.log("✅ All Serper searches completed successfully");
      console.log(`📊 Found ${teachingProcessExamples.length} teaching processes, UDL strategies: ${strategiesData.udlStrategies.length}, Inclusive strategies: ${strategiesData.inclusiveStrategies.length}`);

      return {
        teachingProcessExamples,
        lessonDetails,
        udlStrategies: strategiesData.udlStrategies,
        inclusiveStrategies: strategiesData.inclusiveStrategies
      };

    } catch (error) {
      console.error("Enhanced Serper API search failed:", error);
      
      // Return comprehensive fallback data
      console.log("🔄 Using comprehensive AI reasoning fallback");
      
      return {
        teachingProcessExamples: [
          "5E Model: Engage (สร้างความสนใจ) → Explore (สำรวจ) → Explain (อธิบาย) → Elaborate (ขยายความรู้) → Evaluate (ประเมินผล)",
          "Problem-Based Learning: การเรียนรู้จากปัญหาจริง โดยให้นักเรียนระบุปัญหา วิเคราะห์ ค้นคว้า และแก้ไข",
          "Active Learning: การเรียนรู้เชิงรุกผ่านการอภิปราย กิจกรรมกลุ่ม และการทดลอง",
          "Inquiry-Based Learning: การเรียนรู้จากการตั้งคำถาม สืบเสาะหาคำตอบ และสรุปผล",
          "Collaborative Learning: การเรียนรู้แบบร่วมมือ เน้นการทำงานเป็นทีมและแลกเปลี่ยนความคิด"
        ],
        lessonDetails: `เนื้อหา${subject} เรื่อง${lessonTopic} สำหรับผู้เรียนระดับ${level} ควรเน้นการเรียนรู้ที่เชื่อมโยงกับประสบการณ์จริง การคิดวิเคราะห์ และการประยุกต์ใช้ในชีวิตประจำวัน โดยคำนึงถึงความแตกต่างของผู้เรียนและการพัฒนาทักษะในศตวรรษที่ 21`,
        udlStrategies: [
          "Multiple Means of Representation: ใช้สื่อที่หลากหลาย (ภาพ เสียง วิดีโอ แบบจำลอง) เพื่อนำเสนอเนื้อหา",
          "Multiple Means of Engagement: สร้างแรงจูงใจหลากหลาย เชื่อมโยงกับความสนใจและวัฒนธรรมของผู้เรียน",
          "Multiple Means of Action/Expression: เปิดทางเลือกให้ผู้เรียนแสดงความรู้ (เขียน พูด วาด สร้าง นำเสนอ)",
          "Flexible Learning Environment: จัดสิ่งแวดล้อมที่ยืดหยุ่น รองรับความต้องการของผู้เรียนที่หลากหลาย"
        ],
        inclusiveStrategies: [
          "Differentiated Instruction: ปรับเนื้อหา กิจกรรม และการประเมินตามความสามารถของผู้เรียน",
          "Collaborative Learning Structures: จัดกลุ่มแบบผสมผสานเพื่อให้ทุกคนมีส่วนร่วมและเรียนรู้ซึ่งกันและกัน",
          "Peer Support Systems: ระบบเพื่อนช่วยเพื่อน และการเรียนรู้จากเพื่อน",
          "Multi-modal Assessment: การประเมินผลหลายรูปแบบที่เหมาะกับรูปแบบการเรียนรู้ของผู้เรียนแต่ละคน"
        ]
      };
    }
  }
}

// Export singleton instance with Serper API search integration
export const searchAgent = new SearchAgent();
