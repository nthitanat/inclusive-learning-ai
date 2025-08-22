import { NextResponse } from "next/server";
import { getSession, getSessionsByUserId, getSessionById, deleteSessionById, updateSessionById } from "@/models/session";
import { connectDB } from "@/lib/db";
import jwt from "jsonwebtoken";
import { config } from "zod/v4/core";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";


// POST: Fetch a specific session by sessionId in the body, or latest if not provided
export async function POST(req: Request) {
  await connectDB();
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    userId = decoded.userId;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await req.json();
  const sessionId = body.sessionId;



  // Fetch all sessions for the user
  const allSessions = await getSessionsByUserId(userId);
  const sessionIds = allSessions ? allSessions.map((s: any) => s._id?.toString?.() || s.id) : [];

  let session;
  if (sessionId) {
    session = await getSessionById(sessionId);
    // Security: Ensure the session belongs to the user
    if (!session || session.userId?.toString() !== userId) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }
  } else {
    session = await getSession(userId);
  }

  if (!session) {
    return NextResponse.json({
      configStep: 0,
      configResponse: {},
      generateStep: 0,
      lessonPlan: null,
      conversationHistory: [],
      sessionIds,
      docxBuffer: null,
    }, { status: 200 });
  }
  
  var configStep;
  if(body.configStep == undefined || body.configStep == null || body.configStep == 0) {
    configStep = session.configStep;
  } else {
    configStep = body.configStep;
  }
  console.log(`body.configStep: ${body.configStep}`);
  console.log(`session.configStep: ${session.configStep}`);
  console.log(`configStep: ${configStep}`);

  let configResponse = {};

  // Updated for combined workflow
  switch (configStep) {
    case 1:
      // Combined Step 0: Curriculum + Objectives (from combined-0 API)
      configResponse = {
        หลักสูตร: {
          "learningArea": session.learningArea || {},
          "มาตรฐาน": session.standard || {},
          "ตัวชี้วัดระหว่างทาง": session.interimIndicators || {},
          "ตัวชี้วัดปลายทาง": session.finalIndicators || {},
          "สาระการเรียนรู้": session.content || {},
          "สาระสำคัญ": session.content || {},     
        },
        "วัตถุประสงค์": session.objectives || {},
      };
      break;
    case 2:
      // Combined Step 1: Lesson Plan + Evaluation (from combined-1 API)  
      configResponse = {
        "แผนการจัดกิจกรรม": {
          "แผนการจัดการเรียนรู้": session.lessonPlan || {},
          "สื่อ/อุปกรณ์/แหล่งเรียนรู้": session.teachingMaterials || {},
        },
        "กระบวนการวัดและประเมินผล": session.evaluation || {},
      };
      break;
    default:
      configResponse = {};
  }

  // Convert docxBuffer from base64 to Buffer, then back to base64 for JSON transport
  let docxBufferBase64 = null;
  if (session.docxBuffer) {
    try {
      const buffer = Buffer.from(session.docxBuffer, "base64");
      docxBufferBase64 = buffer.toString("base64");
    } catch (e) {
      docxBufferBase64 = null;
    }
  }

  return NextResponse.json({
    configStep: configStep,
    configResponse: configResponse || {},
    generateStep: session.generateStep || 0,
    lessonPlan: session.lessonPlan || null,
    conversationHistory: session.conversation || [],
    sessionIds,
    docxBuffer: docxBufferBase64,
  });
}

// DELETE: Delete a session by sessionId in the body
export async function DELETE(req: Request) {
  await connectDB();
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    userId = decoded.userId;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await req.json();
  const sessionId = body.sessionId;

  console.log("Received DELETE request for sessionId:", sessionId, "by userId:", userId);

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  // Ensure the session belongs to the user
  const session = await getSessionById(sessionId);
  console.log("Deleting session:", sessionId, "for user:", userId);
  console.log("session userId:", session?.userId?.toString(), "decoded userId:", userId);
  if (!session || session.userId?.toString() !== userId) {
    return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
  }

  await deleteSessionById(sessionId);

  return NextResponse.json({ success: true, message: "Session deleted" }, { status: 200 });
}

// PUT: Update session data (like configStep)
export async function PUT(req: Request) {
  await connectDB();
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    userId = decoded.userId;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await req.json();
  const { sessionId, configStep } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  // Ensure the session belongs to the user
  const session = await getSessionById(sessionId);
  if (!session || session.userId?.toString() !== userId) {
    return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
  }

  // Update the session with new data
  const updateData: any = {};
  if (configStep !== undefined) {
    updateData.configStep = configStep;
  }

  await updateSessionById(sessionId, updateData);

  return NextResponse.json({ success: true, message: "Session updated", configStep: configStep }, { status: 200 });
}