import { NextResponse } from 'next/server';
import {
  getSessionById,
  getSessionsByUserId,
  getAllSession,
  createSession,
  updateSessionById,
  deleteSessionById
} from '@/models/session';
import { getUserById } from '@/models/user';

// GET: /api/admin/sessions or /api/admin/sessions?userId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  try {
    let sessions;
    if (userId) {
      sessions = await getSessionsByUserId(userId);
    } else {
      sessions = await getAllSession();
    }
    // Attach user information to each session
    const sessionsWithUserInfo = await Promise.all(
      sessions.map(async (session: any) => {
        let userInfo = null;
        try {
          // userId may be ObjectId or string
          const user = session.userId ? await getUserById(session.userId.toString()) : null;
          if (user) {
            userInfo = {
              email: user.email || null,
              firstName: user.firstName || null,
              lastName: user.lastName || null
            };
          }
        } catch (error) {
          console.warn('Failed to fetch user info for session:', session._id);
        }
        return { 
          ...session, 
          userEmail: userInfo?.email || null,
          userFirstName: userInfo?.firstName || null,
          userLastName: userInfo?.lastName || null
        };
      })
    );
    return NextResponse.json(sessionsWithUserInfo);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST: /api/admin/sessions
export async function POST(request: Request) {
  const data = await request.json();
  try {
    const result = await createSession(data);
    return NextResponse.json({ insertedId: result.insertedId });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// PUT: /api/admin/sessions
export async function PUT(request: Request) {
  const { sessionId, ...updateData } = await request.json();
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }
  try {
    const result = await updateSessionById(sessionId, updateData);
    return NextResponse.json({ modifiedCount: result.modifiedCount });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE: /api/admin/sessions
export async function DELETE(request: Request) {
  const { sessionId } = await request.json();
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }
  try {
    const result = await deleteSessionById(sessionId);
    return NextResponse.json({ deletedCount: result.deletedCount });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
