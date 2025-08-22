import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSessionById } from "@/models/session";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export async function POST(req: NextRequest) {
  console.log("🔥 FEEDBACK API: POST request received");
  await connectDB();
  
  const token = req.headers.get("Authorization")?.split(" ")[1];
  console.log("🔥 FEEDBACK API: Token present:", !!token);
  
  if (!token) {
    console.log("🔥 FEEDBACK API: No token provided");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    userId = decoded.userId;
    console.log("🔥 FEEDBACK API: User ID:", userId);
  } catch {
    console.log("🔥 FEEDBACK API: Invalid token");
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("🔥 FEEDBACK API: Request body:", body);
    const { sessionId, feedbackData } = body;
    
    if (!sessionId || !feedbackData) {
      console.log("🔥 FEEDBACK API: Missing required fields:", { sessionId: !!sessionId, feedbackData: !!feedbackData });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("🔥 FEEDBACK API: Fetching session data for ID:", sessionId);
    // Fetch session data from database using sessionId
    const session = await getSessionById(sessionId);
    if (!session || session.userId?.toString() !== userId) {
      console.log("🔥 FEEDBACK API: Session not found or unauthorized. Session exists:", !!session, "User match:", session?.userId?.toString() === userId);
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }

    console.log("🔥 FEEDBACK API: Session found, proceeding with finetune data creation...");

    // Extract session data for fine-tuning
    const sessionData = {
      subject: session.subject,
      lessonTopic: session.lessonTopic, 
      level: session.level,
      studentType: session.studentType,
      numStudents: session.numStudents,
      studyPeriod: session.studyPeriod,
      content: session.content,
      // For new combined workflow: only feedback on step 1 (combined lesson plan + evaluation)
      response: feedbackData.step === 1 ? {
        lessonPlan: session.lessonPlan,
        teachingMaterials: session.teachingMaterials,
        evaluation: session.evaluation
      } : null
    };

    const db = await connectDB();
    
    // Create fine-tuning data entry
    const finetuneData = {
      sessionId,
      userId,
      step: feedbackData.step,
      timestamp: new Date(),
      
      // Input data for fine-tuning
      inputData: {
        subject: sessionData.subject,
        lessonTopic: sessionData.lessonTopic,
        level: sessionData.level,
        studentTypes: sessionData.studentType,
        numStudents: sessionData.numStudents,
        studyPeriod: sessionData.studyPeriod,
        content: sessionData.content
      },
      
      // AI Response
      aiResponse: sessionData.response,
      
      // Structured Feedback for Quality Assessment
      feedback: {
        ratings: feedbackData.ratings,
        openComment: feedbackData.openComment || "",
        overallScore: calculateOverallScore(feedbackData.ratings),
        qualityMetrics: calculateQualityMetrics(feedbackData.ratings)
      },
      
      // Ready-to-use fine-tuning format
      finetuningFormat: generateFineTuningFormat(sessionData, feedbackData),
      
      // Metadata
      metadata: {
        step: feedbackData.step,
        stepName: feedbackData.step === 1 ? "combined_lesson_plan_evaluation" : "combined_curriculum_objectives",
        qualityLabel: getQualityLabel(calculateOverallScore(feedbackData.ratings)),
        createdAt: new Date().toISOString(),
        version: "2.0" // Updated for combined workflow
      }
    };

    const result = await db.collection("finetune_data").insertOne(finetuneData);
    
    console.log("🔥 FEEDBACK API: Successfully inserted finetune data with ID:", result.insertedId);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      overallScore: finetuneData.feedback.overallScore 
    });

  } catch (error: any) {
    console.error("🔥 FEEDBACK API: Error saving fine-tune feedback:", error);
    return NextResponse.json(
      { error: "Failed to save feedback", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = await connectDB();
    
    const token = req.headers.get("Authorization")?.split(" ")[1];
    
    // If no token provided, try to fetch data anyway (for admin access)
    if (token) {
      try {
        jwt.verify(token, JWT_SECRET);
      } catch (jwtError: any) {
        console.log("JWT validation failed:", jwtError.message);
        // Continue without authentication for now to allow admin access
      }
    }
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "50");
    const step = searchParams.get("step");
    const qualityLabel = searchParams.get("quality");
    
    const filter: any = {};
    if (step) filter["metadata.step"] = parseInt(step);
    if (qualityLabel) filter["metadata.qualityLabel"] = qualityLabel;
    
    console.log("Fetching finetune data with filter:", filter);
    
    const finetuneData = await db
      .collection("finetune_data")
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(page * limit)
      .limit(limit)
      .toArray();

    // Enrich with user data
    const enrichedData = await Promise.all(
      finetuneData.map(async (data: any) => {
        let userInfo = null;
        try {
          if (data.userId) {
            const user = await db.collection("users").findOne({ _id: new ObjectId(data.userId) });
            if (user) {
              userInfo = {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
              };
            }
          }
        } catch (error) {
          console.warn("Failed to fetch user info for finetune data:", data._id);
        }
        return { ...data, userInfo };
      })
    );

    const total = await db.collection("finetune_data").countDocuments(filter);
    
    console.log("Found", enrichedData.length, "records out of", total, "total");
    
    return NextResponse.json({
      data: enrichedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error("Error in GET /api/feedback/finetune:", error);
    return NextResponse.json(
      { error: "Failed to fetch fine-tune data", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await connectDB();
    
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const result = await db.collection("finetune_data").deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ deletedCount: result.deletedCount });

  } catch (error: any) {
    console.error("Error deleting fine-tune data:", error);
    return NextResponse.json(
      { error: "Failed to delete fine-tune data", details: error.message },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateOverallScore(ratings: any): number {
  let totalScore = 0;
  let totalQuestions = 0;

  for (const category in ratings) {
    for (const question in ratings[category]) {
      totalScore += ratings[category][question];
      totalQuestions++;
    }
  }

  return totalQuestions > 0 ? parseFloat((totalScore / totalQuestions).toFixed(2)) : 0;
}

function calculateQualityMetrics(ratings: any): any {
  const metrics: any = {};
  
  for (const category in ratings) {
    const categoryRatings = Object.values(ratings[category]) as number[];
    metrics[category] = {
      average: categoryRatings.length > 0 ? 
        parseFloat((categoryRatings.reduce((a, b) => a + b, 0) / categoryRatings.length).toFixed(2)) : 0,
      min: Math.min(...categoryRatings),
      max: Math.max(...categoryRatings)
    };
  }
  
  return metrics;
}

function getQualityLabel(score: number): string {
  if (score >= 4.5) return "excellent";
  if (score >= 3.5) return "good";
  if (score >= 2.5) return "acceptable";
  if (score >= 1.5) return "poor";
  return "very_poor";
}

function generateFineTuningFormat(sessionData: any, feedbackData: any): any {
  const stepName = feedbackData.step === 1 ? "combined_lesson_plan_evaluation" : "combined_curriculum_objectives";
  const isHighQuality = calculateOverallScore(feedbackData.ratings) >= 3.5;
  
  const messages = [
    {
      role: "system",
      content: feedbackData.step === 1 
        ? "คุณคือผู้เชี่ยวชาญด้านการออกแบบกระบวนการจัดการเรียนรู้ UDL และ Inclusive Education ที่มีข้อมูลเชิงลึกจากการค้นคว้า รวมถึงการวัดและประเมินผล ตอบเป็น JSON เท่านั้น"
        : "คุณคือผู้เชี่ยวชาญด้านหลักสูตรและการกำหนดวัตถุประสงค์การเรียนรู้ ตอบเป็น JSON เท่านั้น"
    },
    {
      role: "user",
      content: generateUserPrompt(sessionData, feedbackData.step)
    },
    {
      role: "assistant",
      content: JSON.stringify(sessionData.response)
    }
  ];

  return {
    messages,
    metadata: {
      quality_score: calculateOverallScore(feedbackData.ratings),
      is_high_quality: isHighQuality,
      step: feedbackData.step,
      step_name: stepName,
      feedback_ratings: feedbackData.ratings,
      open_comment: feedbackData.openComment || "",
      session_context: {
        subject: sessionData.subject,
        level: sessionData.level,
        topic: sessionData.lessonTopic
      }
    }
  };
}

function generateUserPrompt(sessionData: any, step: number): string {
  if (step === 1) {
    return `ออกแบบกระบวนการจัดการเรียนรู้แบบ UDL โดยคำนึงถึงความแตกต่างของนักเรียนแต่ละประเภทในห้อง รวมถึงการวัดและประเมินผล

**ข้อมูลพื้นฐาน:**
- กลุ่มสาระ: ${sessionData.subject}
- เรื่อง: ${sessionData.lessonTopic}
- ระดับชั้น: ${sessionData.level}
- เนื้อหา: ${JSON.stringify(sessionData.content)}
- จำนวนชั่วโมงทั้งหมดในการสอน: ${sessionData.studyPeriod} ชั่วโมง
- จำนวนนักเรียน: ${sessionData.numStudents} คน
- ประเภทนักเรียน: ${JSON.stringify(sessionData.studentType)}

กรุณาออกแบบ:
1. แผนการจัดการเรียนรู้ (lessonPlan)
2. สื่อ/อุปกรณ์/แหล่งเรียนรู้ (teachingMaterials)  
3. กระบวนการวัดและประเมินผล (evaluation)`;
  } else if (step === 0) {
    return `วิเคราะห์หลักสูตรและกำหนดวัตถุประสงค์การเรียนรู้

**ข้อมูลพื้นฐาน:**
- กลุ่มสาระ: ${sessionData.subject}
- เรื่อง: ${sessionData.lessonTopic}
- ระดับชั้น: ${sessionData.level}
- จำนวนนักเรียน: ${sessionData.numStudents} คน
- ประเภทนักเรียน: ${JSON.stringify(sessionData.studentType)}

กรุณาวิเคราะห์และกำหนด:
1. มาตรฐานการเรียนรู้ (standard)
2. ตัวชี้วัด (indicators)
3. วัตถุประสงค์การเรียนรู้ (objectives)
4. สาระสำคัญ (content)`;
  }
  return "";
}
