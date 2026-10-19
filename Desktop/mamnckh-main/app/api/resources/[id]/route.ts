import { resources } from '@/lib/resources/data';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const resource = resources.find((item) => item.id === id);
  return resource ? NextResponse.json({ resource }) : NextResponse.json({ error: 'Không tìm thấy tài nguyên.' }, { status: 404 });
}
