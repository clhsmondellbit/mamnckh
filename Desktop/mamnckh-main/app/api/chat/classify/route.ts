import { classifySafety } from '@/lib/safety/classify';
import { presentationForLevel } from '@/lib/safety/policy';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = z.object({ message: z.string().trim().min(1).max(2000) }).parse(await request.json());
    const assessment = classifySafety(message);
    // Client-facing data deliberately excludes confidence and raw rule reasons.
    return NextResponse.json({ supportLevel: assessment.level, ...presentationForLevel(assessment.level) });
  } catch {
    return NextResponse.json({ error: 'Tin nhắn chưa hợp lệ.' }, { status: 400 });
  }
}
