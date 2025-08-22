import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/db";
import { getSessionById, updateSessionById } from "@/models/session";
import jwt from "jsonwebtoken";
import { OptimizedLessonPipeline, createResilientPipeline, monitoredPipeline } from "@/lib/optimizedPipeline";

export async function POST(request: NextRequest, { params }: { params: Promise<{ configStep: string }> }) {
  const { configStep } = await params;
  await connectDB();
  const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
  const token = request.headers.get("Authorization")?.split(" ")[1];
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
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

    const session = await getSessionById(sessionId);
    if (!session || session.userId?.toString() !== userId) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }

    console.log(`🚀 Processing optimized config step: ${configStep} for sessionId: ${sessionId}`);

    // Initialize optimized pipeline with monitoring and resilience
    const basePipeline = new OptimizedLessonPipeline();
    
    switch (configStep) {
      // Combined Step 0: Curriculum + Objectives
      case "0": {
        try {
          await basePipeline.initialize(body.subject);
          
          // Run steps 0 and 1 sequentially for now (can be optimized later)
          const curriculumResult = await basePipeline.step0(body.subject, body.lessonTopic, body.level);
          
          // Update session with step 0 results
          await updateSessionById(sessionId, {
            configStep: parseInt(configStep)+1,
            subject: body.subject,
            lessonTopic: body.lessonTopic,
            learningArea: curriculumResult["กลุ่มสาระการเรียนรู้"],
            level: body.level,
            standard: curriculumResult["มาตรฐาน"],
            interimIndicators: curriculumResult["ตัวชี้วัดระหว่างทาง"],
            finalIndicators: curriculumResult["ตัวชี้วัดปลายทาง"],
            content: curriculumResult["สาระการเรียนรู้"],
            keyContent: curriculumResult["สาระสำคัญ"]
          });

          // Get updated session and run step 1
          const updatedSession = await getSessionById(sessionId);
          const objectivesResult = await basePipeline.step1(updatedSession);
          
          await updateSessionById(sessionId, {
            objectives: objectivesResult["จุดประสงค์การเรียนรู้"],
            keyCompetencies: objectivesResult["สมรรถนะผู้เรียน"],
          });

          return NextResponse.json({ 
            responses: {
              curriculum: curriculumResult,
              objectives: objectivesResult
            }
          });
        } catch (error: any) {
          if (error?.message?.includes("ไม่พบข้อมูลหลักสูตร")) {
            return NextResponse.json({ error: "ไม่พบข้อมูลหลักสูตร กรุณาลองใหม่" }, { status: 404 });
          }
          throw error;
        }
      }

      // Combined Step 1: Lesson Plan + Evaluation
      case "1": {
        const numStudents = body.numStudents || 30;
        const studentType = body.studentType || [];
        const studyPeriod = body.studyPeriod || 9;

        // Run lesson plan and evaluation sequentially for now
        console.log("🤖 Running combined lesson plan and evaluation");
        
        const lessonPlanResult = await basePipeline.step2Agent(session, numStudents, studentType, studyPeriod);
        
        // Update session with lesson plan results
        await updateSessionById(sessionId, {
          configStep: parseInt(configStep) + 1,
          studyPeriod: studyPeriod,
          numStudents: numStudents,
          studentType: studentType,
          lessonPlan: lessonPlanResult.response,
          teachingMaterials: lessonPlanResult.teachingMaterials,
          enhancedData: lessonPlanResult.enhancedData,
          searchMetadata: lessonPlanResult.searchMetadata,
        });
        
        // Get updated session and run evaluation
        const updatedSession = await getSessionById(sessionId);
        const evaluationResult = await basePipeline.step3(updatedSession);
        
        await updateSessionById(sessionId, {
          evaluation: evaluationResult,
        });

        return NextResponse.json({
          responses: {
            lessonPlan: lessonPlanResult,
            evaluation: evaluationResult
          }
        });
      }

      // Legacy individual steps (for backward compatibility)
      // case "0": {
      //   try {
      //     await basePipeline.initialize(body.subject);
      //     const result = await basePipeline.step0(body.subject, body.lessonTopic, body.level);
          
      //     await updateSessionById(sessionId, {
      //       configStep: parseInt(configStep) + 1,
      //       subject: body.subject,
      //       lessonTopic: body.lessonTopic,
      //       learningArea: result["กลุ่มสาระการเรียนรู้"],
      //       level: body.level,
      //       standard: result["มาตรฐาน"],
      //       interimIndicators: result["ตัวชี้วัดระหว่างทาง"],
      //       finalIndicators: result["ตัวชี้วัดปลายทาง"],
      //       content: result["สาระการเรียนรู้"],
      //       keyContent: result["สาระสำคัญ"]
      //     });

      //     return NextResponse.json({ response: result });
      //   } catch (error: any) {
      //     if (error?.message?.includes("ไม่พบข้อมูลหลักสูตร")) {
      //       return NextResponse.json({ error: "ไม่พบข้อมูลหลักสูตร กรุณาลองใหม่" }, { status: 404 });
      //     }
      //     throw error;
      //   }
      // }

      // case "1": {
      //   const result = await basePipeline.step1(session);
        
      //   await updateSessionById(sessionId, {
      //     configStep: parseInt(configStep) + 1,
      //     objectives: result["จุดประสงค์การเรียนรู้"],
      //     keyCompetencies: result["สมรรถนะผู้เรียน"],
      //   });

      //   return NextResponse.json({ response: result });
      // }

      // // case "2": {
      // //   const numStudents = body.numStudents || 30;
      // //   const studentType = body.studentType || [];
      // //   const studyPeriod = body.studyPeriod || 9;

      // //   const result = await basePipeline.step2(session, numStudents, studentType, studyPeriod);
        
      // //   await updateSessionById(sessionId, {
      // //     configStep: parseInt(configStep) + 1,
      // //     studyPeriod: studyPeriod,
      // //     numStudents: numStudents,
      // //     studentType: studentType,
      // //     lessonPlan: result.response,
      // //     teachingMaterials: result.teachingMaterials,
      // //   });

      // //   return NextResponse.json(result);
      // // }

      // case "2": {
      //   const numStudents = body.numStudents || 30;
      //   const studentType = body.studentType || [];
      //   const studyPeriod = body.studyPeriod || 9;

      //   console.log("🤖 Using Step 2 Agent with enhanced search and reasoning");
        
      //   const result = await basePipeline.step2Agent(session, numStudents, studentType, studyPeriod);
        
      //   await updateSessionById(sessionId, {
      //     configStep: parseInt(configStep.replace('-agent', '')) + 1,
      //     studyPeriod: studyPeriod,
      //     numStudents: numStudents,
      //     studentType: studentType,
      //     lessonPlan: result.response,
      //     teachingMaterials: result.teachingMaterials,
      //     enhancedData: result.enhancedData,
      //     searchMetadata: result.searchMetadata,
      //   });

      //   return NextResponse.json(result);
      // }

      // case "3": {
      //   const result = await basePipeline.step3(session);
        
      //   await updateSessionById(sessionId, {
      //     configStep: parseInt(configStep) + 1,
      //     evaluation: result,
      //   });

      //   return NextResponse.json({ response: result });
      // }

      // Advanced: Parallel processing for steps 1-2
      case "parallel-1-2": {
        const numStudents = body.numStudents || 30;
        const studentType = body.studentType || [];
        const studyPeriod = body.studyPeriod || 9;

        await basePipeline.initialize(session.subject);
        const result = await basePipeline.runParallelSteps(
          session,
          {}, // step1 input
          { numStudents, studentType, studyPeriod } // step2 input
        );

        await updateSessionById(sessionId, {
          configStep: 3, // Skip to step 3 since we did 1-2 in parallel
          objectives: result.objectives["จุดประสงค์การเรียนรู้"],
          keyCompetencies: result.objectives["สมรรถนะผู้เรียน"],
          studyPeriod,
          numStudents,
          studentType,
          lessonPlan: result.lessonPlan.response,
          teachingMaterials: result.lessonPlan.teachingMaterials,
        });

        return NextResponse.json({
          objectives: result.objectives,
          lessonPlan: result.lessonPlan
        });
      }

      // Batch processing endpoint
      case "batch": {
        const sessions = body.sessions || [];
        if (!Array.isArray(sessions) || sessions.length === 0) {
          return NextResponse.json({ error: "Invalid sessions array" }, { status: 400 });
        }

        const results = await basePipeline.batchProcess(sessions);
        return NextResponse.json({ results });
      }

      default:
        return NextResponse.json({ error: "Invalid config step" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("❌ Pipeline Error:", error);
    return NextResponse.json(
      { error: "Internal processing error", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// Additional endpoint for health checking the pipeline
export async function GET(request: NextRequest) {
  try {
    const pipeline = new OptimizedLessonPipeline();
    
    // Basic health check - try to initialize with a test subject
    await pipeline.initialize("วิทยาศาสตร์");
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      features: {
        parallelProcessing: true,
        batchProcessing: true,
        errorRecovery: true,
        performanceMonitoring: true,
        enhancedStep2Agent: true,
        internetSearch: true,
        udlIntegration: true,
        inclusiveClassroomSupport: true
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "unhealthy", error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
