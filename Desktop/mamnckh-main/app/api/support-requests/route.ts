import { isCurrentStaffAuthenticated } from '@/lib/auth/staff';
import { createSupportRequest, listSupportRequests, StorageUnavailableError } from '@/lib/db/support-requests';
import { SUPPORT_TOPICS } from '@/lib/types';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const supportRequestSchema = z.object({
  preferredName: z.string().trim().max(80).optional(),
  contactPreference: z.string().trim().max(120).optional(),
  topic: z.enum(SUPPORT_TOPICS),
  supportLevel: z.enum(['green', 'yellow']).default('yellow'),
  studentNote: z.string().trim().max(700).optional(),
  requestedSupport: z.string().trim().max(120).optional(),
  consent: z.literal(true),
});

export async function POST(request: NextRequest) {
  try {
    const payload = supportRequestSchema.parse(await request.json());
    const created = await createSupportRequest(payload);
    return NextResponse.json({ id: created.id, createdAt: created.createdAt }, { status: 201 });
  } catch (error) {
    if (error instanceof StorageUnavailableError) return NextResponse.json({ error: 'Nhà trường chưa bật tính năng gửi yêu cầu hỗ trợ. Bạn vẫn có thể tìm một người lớn đáng tin cậy trực tiếp.' }, { status: 503 });
    return NextResponse.json({ error: 'Yêu cầu hỗ trợ chưa hợp lệ.' }, { status: 400 });
  }
}

export async function GET() {
  if (!(await isCurrentStaffAuthenticated())) return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 401 });
  try {
    return NextResponse.json({ requests: await listSupportRequests() });
  } catch (error) {
    if (error instanceof StorageUnavailableError) return NextResponse.json({ error: 'Chưa có kho dữ liệu yêu cầu hỗ trợ.' }, { status: 503 });
    return NextResponse.json({ error: 'Không thể tải yêu cầu hỗ trợ.' }, { status: 500 });
  }
}
