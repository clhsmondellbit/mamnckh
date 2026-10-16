import { resources } from '@/lib/resources/data';
import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ resources });
}
