import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, sessionCookie } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/saved-searches - Fetches all saved searches for the current user
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(sessionCookie.name)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifySessionToken(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searches = await prisma.savedSearch.findMany({
      where: { userId: user.sub },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ searches });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 });
  }
}

// POST /api/saved-searches - Creates a new saved search
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(sessionCookie.name)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifySessionToken(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, filters } = body;

    if (!name || !filters) {
      return NextResponse.json({ error: 'Missing name or filters' }, { status: 400 });
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        name,
        filters,
        userId: user.sub,
      },
    });

    return NextResponse.json({ savedSearch }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create saved search' }, { status: 500 });
  }
}

// DELETE /api/saved-searches?id=... - Deletes a saved search
export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(sessionCookie.name)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifySessionToken(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await prisma.savedSearch.deleteMany({
      where: {
        id: id,
        userId: user.sub, // Ensure users can only delete their own searches
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete saved search' }, { status: 500 });
  }
}
