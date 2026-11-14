import { resources } from '@/lib/resources/data';
import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ resources: resources.filter((resource) => resource.audience === 'student') });
}
