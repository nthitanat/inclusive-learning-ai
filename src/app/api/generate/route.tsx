import { NextRequest, NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { connectDB } from "@/lib/db";
import { getSession, createSession, updateSession, getSessionById, updateSessionById } from "@/models/session";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import libre from "libreoffice-convert";
import util from "util";
import axios from "axios";
import FormData from "form-data"; // <-- Add this import
import mammoth from "mammoth";
import puppeteer from "puppeteer";
import { lessonPlanToText } from "@/utils/lessonPlanToText";

export const runtime = "nodejs"; // Switch to Node.js runtime

export async function POST(request: NextRequest, { params }) {
  //connecting to the database
  await connectDB();
  //user authentication
  const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
  const token = request.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.userId;
    console.log("Decoded userId:", userId);
  } catch {
    console.error("Invalid token");
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  try {
    // Parse sessionId from request body
    const body = await request.json();
    const sessionId = body.sessionId;
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Fetch session by sessionId
    const session = await getSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const learningArea = session.learningArea;
    const subject = session.subject;
    const lessonTopic = session.lessonTopic;
    const level = session.level;
    const StudyHours = session.StudyHours;
    const timePerClass = session.timePerClass;
    const keyContent = session.keyContent['สาระสำคัญ'];
    const standard = session.standard;
    const interimIndicators = session.interimIndicators;
    const finalIndicators = session.finalIndicators;
    // แยกจุดประสงค์แต่ละประเภท พร้อมใส่เลขนำหน้า
    const knowledgeObjectives = Object.values(session.objectives['จุดประสงค์ด้านความรู้']).map((value, idx) => ({
      item: `4.1.${idx + 1} ${value}`,
    }));
    const skillObjectives = Object.values(session.objectives['จุดประสงค์ด้านทักษะ']).map((value, idx) => ({
      item: `4.2.${idx + 1} ${value}`,
    }));
    const attributeObjectives = Object.values(session.objectives['จุดประสงค์ด้านคุณลักษณะ']).map((value, idx) => ({
      item: `4.3.${idx + 1} ${value}`,
    }));
    const keyCompetencies = Object.values(session.keyCompetencies).map(
      (value, idx) => ({
        item: `${5}.${idx + 1} ${value}`,
      })
    );
    const content = Object.values(session.content).map((value, idx) => ({
      item: `${6}.${idx + 1} ${value}`,
    }));
    const lessonPlanText = lessonPlanToText(session.lessonPlan);
    const teachingMaterials = Object.values(session.teachingMaterials).map((value, idx) => ({
      item: `${9}.${idx + 1} ${value}`,
    }));
    const evaluation = lessonPlanToText(session.evaluation);

    
    //---------------- Template Format ----------------
    // Load the docx file as binary
    const file = fs.readFileSync(
      path.resolve(process.cwd() + "/src/data/curriculum_template.docx"),
      "binary"
    );

    // Create a PizZip instance
    const zip = new PizZip(file);

    // Create a docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.setData({
      keyContent,
      learningArea: learningArea,
      subject: subject,
      lessonTopic: lessonTopic,
      level: level,
      StudyHours: StudyHours,
      timePerClass: timePerClass,
      content: content,
      interimIndicators: interimIndicators,
      standard: standard,
      keyCompetencies: keyCompetencies,
      lessonPlan: lessonPlanText,
      knowledgeObjectives,   
      skillObjectives,      
      attributeObjectives,
      teachingMaterials,
      evaluation, 
    });
    console.log('lessonTopic:', lessonTopic);

    try {
      // Render the document (replace all occurrences of {name} and loop over {#items}{item}{/items})
      doc.render();
    } catch (error) {
      console.error(error);
      throw error;
    }

    // Generate the output docx as a buffer (in memory)
    const buf = doc.getZip().generate({ type: "nodebuffer" });

    // Store the buffer in the session document (as a base64 string)
    await updateSessionById(sessionId, { docxBuffer: buf.toString("base64") });

    // Return the file as a response (no need to write/read/delete from disk)
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename=curriculum_${userId}.docx`,
      },
    });
  } catch (error) {
    console.error("Error generating document:", error);
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 }
    );
  }
}
