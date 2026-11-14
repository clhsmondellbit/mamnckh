import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { listSupportRequests, StorageUnavailableError } from '@/lib/db/support-requests';
import { isSameOriginRequest, noStoreHeaders } from '@/lib/security/request';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  return NextResponse.json(
    { error: 'Biểu mẫu yêu cầu chung đã được thay bằng School Support Center để bạn chọn rõ người nhận và đồng ý chia sẻ dữ liệu.' },
    { status: 410, headers: noStoreHeaders() },
  );
}

export async function GET() {
  const actor = await getCurrentStaffSession();
  if (!actor) return NextResponse.json({ error: 'Cần đăng nhập.' }, { status: 401, headers: noStoreHeaders() });
  if (!staffHasRole(actor, ['super_admin','admin'])) return NextResponse.json({ error: 'Chỉ quản trị viên được xem hàng đợi yêu cầu chưa gắn người nhận.' }, { status: 403, headers: noStoreHeaders() });
  try {
    return NextResponse.json({ requests: await listSupportRequests(actor) }, { headers: noStoreHeaders() });
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      return NextResponse.json({ error: 'Chưa có kho dữ liệu yêu cầu hỗ trợ.' }, { status: 503, headers: noStoreHeaders() });
    }
    return NextResponse.json({ error: 'Không thể tải yêu cầu hỗ trợ.' }, { status: 500, headers: noStoreHeaders() });
  }
}
