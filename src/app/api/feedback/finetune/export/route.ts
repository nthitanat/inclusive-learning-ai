import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export async function GET(req: NextRequest) {
  await connectDB();
  
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const db = await connectDB();
    
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "jsonl";
    const minScore = parseFloat(searchParams.get("minScore") || "3.5");
    const step = searchParams.get("step");
    const limit = parseInt(searchParams.get("limit") || "1000");
    
    // Build filter
    const filter: any = {
      "feedback.overallScore": { $gte: minScore }
    };
    
    if (step) {
      filter["metadata.step"] = parseInt(step);
    }
    
    // Fetch high-quality fine-tuning data
    const finetuneData = await db
      .collection("finetune_data")
      .find(filter)
      .sort({ "feedback.overallScore": -1, timestamp: -1 })
      .limit(limit)
      .toArray();

    if (format === "jsonl") {
      // OpenAI fine-tuning format (JSONL)
      const jsonlData = finetuneData
        .map((data: any) => JSON.stringify(data.finetuningFormat))
        .join('\n');
      
      return new NextResponse(jsonlData, {
        headers: {
          'Content-Type': 'application/jsonl',
          'Content-Disposition': `attachment; filename="finetune-data-${Date.now()}.jsonl"`
        }
      });
    } else {
      // JSON format for analysis
      const analysisData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalRecords: finetuneData.length,
          minQualityScore: minScore,
          stepFilter: step || "all",
          qualityDistribution: await getQualityDistribution(db, filter),
          avgScore: finetuneData.reduce((acc: number, d: any) => acc + (d.feedback?.overallScore || 0), 0) / finetuneData.length
        },
        trainingData: finetuneData.map((data: any) => ({
          id: data._id,
          step: data.step,
          score: data.feedback?.overallScore,
          subject: data.inputData?.subject,
          topic: data.inputData?.lessonTopic,
          level: data.inputData?.level,
          timestamp: data.timestamp,
          finetuningFormat: data.finetuningFormat
        }))
      };
      
      return NextResponse.json(analysisData, {
        headers: {
          'Content-Disposition': `attachment; filename="finetune-analysis-${Date.now()}.json"`
        }
      });
    }

  } catch (error: any) {
    console.error("Error exporting fine-tune data:", error);
    return NextResponse.json(
      { error: "Failed to export data", details: error.message },
      { status: 500 }
    );
  }
}

async function getQualityDistribution(db: any, baseFilter: any) {
  const pipeline = [
    { $match: baseFilter },
    {
      $group: {
        _id: "$metadata.qualityLabel",
        count: { $sum: 1 },
        avgScore: { $avg: "$feedback.overallScore" }
      }
    },
    { $sort: { avgScore: -1 } }
  ];
  
  return await db.collection("finetune_data").aggregate(pipeline).toArray();
}
