import { NextRequest, NextResponse } from "next/server";
import { docsQuery } from "@/lib/docsQuery";
import { callQueryLLM } from "@/lib/backup/queryLLM";
import { callSimpleLLM } from "@/lib/backup/simpleLLM";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/db";
import { getSessionById, createSession, updateSessionById } from "@/models/session";
import jwt from "jsonwebtoken";
import { extractJSON } from "@/utils/extractJSON";

export async function POST(request: NextRequest, { params }) {
  const { configStep } = await params;
  await connectDB();
  const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
  const token = request.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.userId;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sessionId = body.sessionId;
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Always fetch session by sessionId
    const session = await getSessionById(sessionId);
    if (!session || session.userId?.toString() !== userId) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }

    console.log(`Processing config step: ${configStep} for sessionId: ${sessionId}`);

    switch (configStep) {
      case "0": {
        const data0_0 = await callQueryLLM(body.subject, body.lessonTopic, body.level);

        // Check for "ไม่พบ" in data0_0
        if (typeof data0_0 === "string" && data0_0.includes("ไม่พบ")) {
          console.log("No course data found, returning error response");
          return NextResponse.json({ error: "ไม่พบข้อมูลหลักสูตร กรุณาลองใหม่" }, { status: 404 });
        }

        const response0_0 = await extractJSON(data0_0 as string);
        const standard = response0_0["มาตรฐาน"];
        const interimIndicators = response0_0["ตัวชี้วัดระหว่างทาง"];
        const finalIndicators = response0_0["ตัวชี้วัดปลายทาง"];
        const LearningArea = response0_0["กลุ่มสาระการเรียนรู้"];
        const task0_1 = `จากข้อมูลมาตรฐานการเรียนรู้ต่อไปนี้

        ${JSON.stringify(standard)} ตัวชี้วัดระหว่างทาง: ${JSON.stringify(interimIndicators)} ตัวชี้วัดปลายทาง: ${JSON.stringify(finalIndicators)}
        ให้คุณช่วยคิดหัวข้อสาระาการเรียนแบบละเอียด ตอบในรูปแบบ JSON โดยไม่ต้องมี field อื่นๆ แค่ใช้ field เป็นตัวเลขของแต่ละข้อเช่น 1,2,3,4 หากไม่สามารถคิดหัวข้อให้ตรงประเด็นได้ ให้ตอบว่า "ไม่พบหัวข้อที่เกี่ยวข้อง" และห้ามใช้หัวข้อที่ซ้ำกันในแต่ละข้อ
        `;
        const data0_1 = await callSimpleLLM(task0_1);
        const response0_1 = await extractJSON(data0_1);

        const task0_2 = `จา่กหัวข้อสาระการเรียนรู้ต่อไปนี้ ${JSON.stringify(response0_1)} ให้สรุปสาระสำคัญแบบละเอียด โดยรวมเป็น ประโยคบทสรุปสั้นๆ ตอบในรูปแบบ JSON โดยมี field เป็น "สาระสำคัญ" หากไม่สามารถสรุปได้ให้ตอบว่า "ไม่พบสาระสำคัญที่เกี่ยวข้อง" `;
        const data0_2 = await callSimpleLLM(task0_2);
        const response0_2 = await extractJSON(data0_2);
        const response0 = {
          ...response0_0,
          "สาระการเรียนรู้": response0_1,
          ...response0_2,
        };

        await updateSessionById(sessionId, {
          configStep: parseInt(configStep) + 1,
          subject: body.subject,
          lessonTopic: body.lessonTopic,
          learningArea: LearningArea,
          level: body.level,
          standard: standard,
          interimIndicators: interimIndicators,
          finalIndicators: finalIndicators,
          content: response0_1,
          keyContent: response0_2
        });

        return NextResponse.json({
          response: response0,
        });
      }
      case "1": {
        const intervalIndicators = session.interimIndicators;
        const finalIndicators = session.finalIndicators;

        const task1_0 = `ออกแบบจุดประสงค์การเรียนรู้ 3 ด้านโดยมี ด้านความรู้, ด้านทักษะ และด้านคุณลักษณะ
        สำหรับวิชา: ${session.subject} เนื้อหา: ${session.content} ระดับชั้น: ${session.level} โดยจะต้องตอบสนองตัวชี้วัด ${intervalIndicators} และ ${finalIndicators}
        โดยจะต้องตอบในรูปแบบ JSON เท่านั้นและประกอบไปด้วย field
        "จุดประสงค์ด้านความรู้", "จุดประสงค์ด้านทักษะ", "จุดประสงค์ด้านคุณลักษณะ" โดยแต่ละ field จะต้องเป็น array ของจุดประสงค์การเรียนรู้ที่เกี่ยวข้อง`;

        const data1_0 = await callSimpleLLM(task1_0);
        const response1_0 = await extractJSON(data1_0);

        const keyCompetencies = {
          "5.1": "ความสามารถในการสื่อสาร",
          "5.2": "ความสามารถในการคิด",
          "5.3": "ความสามารถในการแก้ปัญหา",
          "5.4": "ความสามารถในการใช้ทักษะชีวิต",
        };

        await updateSessionById(sessionId, {
          configStep: parseInt(configStep) + 1,
          objectives: response1_0,
          keyCompetencies: keyCompetencies,
        });

        const response1 = {
          "จุดประสงค์การเรียนรู้": response1_0,
          "สมรรถนะผู้เรียน": keyCompetencies,
        };

        return NextResponse.json({
          response: response1,
        });
      }
      case "2": {
        const numStudents = body.numStudents || 30;
        const studentType = body.studentType || [];
        const studyPeriod = body.studyPeriod || 9;
        const studentTypesStr = studentType.length > 0
          ? studentType.map(
              (s: any, idx: number) =>
                `ประเภทที่ ${idx + 1}: ${s.type} (${s.percentage}%)`
            ).join(", ")
          : "ไม่ระบุประเภทนักเรียน";

        const task2_0 = `ออกแบบกิจกรรมการจัดการเรียนรู้แบบ UDL โดยคำนึงถึงความแตกต่างของนักเรียนแต่ละประเภทในห้อง (Inclusive Classroom)
                          โดยคุณจะต้องค้นหาความรู้เชิงลึกเกี่ยวกับเนื่อหาของบนเรียนนั้นๆ เพื่อใช้ในการออกแบบกิจกรรมการเรียนรู้ที่เหมาะสม
                          ให้ตอบกลับในรูปแบบ JSON โดยใช้ลำดับหัวข้อเริ่มจาก 8 และลงลึกตามกิจกรรม เช่น 8.1, 8.1.1 ฯลฯ

                          JSON ต้องมีโครงสร้าง:
                          - ขั้น (เช่น: นำเข้าสู่บทเรียน, จัดกิจกรรมการเรียนรู้)
                            - กิจกรรม
                              - ชื่อรายการกิจกรรม (ระบุเวลาทั้งหมดของกิจกรรมนั้น)
                                - วัตถุประสงค์ (เขียนให้สอดคล้องกับตัวชี้วัด)
                                - ขั้นตอนการดำเนินกิจกรรม (เวลา)
                                    - แยกเป็นขั้นตอนหลัก และขั้นตอนย่อยโดยละเอียด (เวลาขั้นตอนหลัก และ ขั้นตอนย่อย)
                                    เช่น:
                                      - หากเป็นการทดลอง: ระบุชื่อการทดลองจริง พร้อมวัสดุ วิธีการทดลอง วิธีเก็บข้อมูล และวิธีสรุปผล
                                      - หากเป็นการอภิปราย: ระบุคำถามอภิปรายเชิงวิเคราะห์
                                      - หากเป็นกิจกรรมสร้างสรรค์: ระบุว่าใช้กระบวนการใด เช่น Design Thinking พร้อมระยะเวลาในแต่ละเฟส
                                - สื่อ/เครื่องมือที่ใช้ (ระบุชื่อชัดเจน และลิงก์ถ้ามี)
                                - บทบาทผู้เรียน
                                - บทบาทครู
                                - แนวทางการปรับกิจกรรมสำหรับผู้เรียนที่หลากหลายประเภท (inclusive classroom)
                                    - แยกเป็นประเภทนักเรียนที่หลากหลายและเปอร์เซ็นต์ดังนี้: ${studentTypesStr}
                          ใช้ข้อมูลอินพุตต่อไปนี้:
                          - เนื้อหา: ${JSON.stringify(session.content)}
                          - จำนวนชั่วโมงทั้งหมดในการสอน: ${50*studyPeriod} นาที
                          **ห้ามใช้ตัวอย่างกิจกรรมง่ายเกินไป เช่น วาดภาพ/จับคู่คำศัพท์ เว้นแต่มีความเกี่ยวโยงกับการวิเคราะห์หรือออกแบบทางวิทยาศาสตร์จริง เช่น “วาดกราฟแสดงความเร่ง” หรือ “จับคู่แรงกับผลในระบบจริง”
                          **ทุกกิจกรรมต้องสอดคล้องกับสาระและตัวชี้วัด และมีเป้าหมายที่ระดับวิเคราะห์ ประเมินค่า หรือสร้างสรรค์ ตาม Bloom’s Taxonomy และต้องประยุกต์ใช้ความรู้ เช่น การจำลองสถานการณ์แรง, การวิเคราะห์ระบบกลไก, หรือการออกแบบสิ่งประดิษฐ์จริง
`;
        const data2_0 = await callSimpleLLM(task2_0);
        const response2_0 = await extractJSON(data2_0);

        const task2_1 = `จากข้อมูลกิจกรรมการเรียนรู้ที่ออกแบบไว้ ${JSON.stringify(response2_0)} ให้คุณช่วยสรุปเขียนรายการ สื่อ/อุปกรณ์/แหล่งเรียนรู้รูปแบบในรูปแบบ JSON โดยไม่ต้องมี field อื่นๆ แค่ใช้ field เป็นตัวเลขของแต่ละข้อเช่น 1,2,3,4`;
        const data2_1 = await callSimpleLLM(task2_1);
        const response2_1 = await extractJSON(data2_1);

        await updateSessionById(sessionId, {
          configStep: parseInt(configStep) + 1,
          studyPeriod: studyPeriod || 1,
          numStudents: numStudents,
          studentType: studentType,
          lessonPlan: response2_0,
          teachingMaterials: response2_1,
        });

        return NextResponse.json({
          response: response2_0,
          teachingMaterials: response2_1,
        });
      }
      case "3": {
        const task3_0 = `ออกแบบกระบวนการวัดและประเมินผลการเรียนรู้สำหรับแผนการจัดกิจกรรมการเรียนรู้ต่อไปนี้:
                              ${JSON.stringify(session.lessonPlan)}

                              โดยต้องสอดคล้องกับตัวชี้วัดระหว่างทาง: ${JSON.stringify(session.interimIndicators)}

                              **คำแนะนำ**: 
                              - แบ่งรายละเอียดเป็น 3 ส่วนหลักในรูปแบบ JSON:
                                1. "วิธีวัดและประเมินผล" (แบ่งเป็น: วัดความรู้, วัดทักษะและกระบวนการ, วัดคุณลักษณะ, การประเมินสมรรถนะสำคัญ)
                                2. "เครื่องมือที่ใช้วัดและประเมินผล" (เช่น แบบทดสอบ, แบบสังเกต, แบบประเมินตนเอง ฯลฯ)
                                3. "เกณฑ์การวัดและประเมินผล" (เช่น แบบทดสอบวัดความรู้ ให้ระบุเกณฑ์คะแนนแต่ละด้าน รวมกันต้องได้ 100%)

                                -วิธีวัดและประเมินผล
                                  -วัดความรู้
                                  -วัดทักษะและกระบวนการ
                                  -วัดคุณลักษณะ
                                  -การประเมินสมรรถนะสำคัญ                                
                                -เครื่องมือที่ใช้วัดและประเมินผล                        
                                -เกณฑ์การวัดและประเมินผล
                                  -รูปแบบการประเมิน (1-5 แบบเช่น แบบทดสอบวัดความรู้, แบบฝึกหัดทบทวนท้ายบทเรียน เป็นต้น )
                                    -ระบุคะแนนเต็มของแต่ละรูปแบบ
                                    -ระบุเกณฑ์ย่อยของแต่ละรูปแบบ
                                    -รวมทุกรูปแบบ"ต้องได้ "100%" โดยอาจให้น้ำหนักแต่ละรูปแบบแตกต่างกันได้
                         
                              ตอบกลับเป็น JSON เท่านั้น
        `;

        const data3_0 = await callSimpleLLM(task3_0);
        const response3_0 = await extractJSON(data3_0);

        await updateSessionById(sessionId, {
          configStep: parseInt(configStep) + 1,
          evaluation: response3_0,
        });

        return NextResponse.json({
          response: response3_0,
        });
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}


