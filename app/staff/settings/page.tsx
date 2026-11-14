import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { redirect } from 'next/navigation';
export default async function StaffSettingsPage() {
  const actor = await getCurrentStaffSession();
  if (!actor) redirect('/staff/login');
  if (!staffHasRole(actor, ['super_admin','admin'])) redirect('/staff/dashboard');
  return <div className="page-shell py-10"><div className="card mx-auto max-w-3xl p-7"><p className="eyebrow">Cấu hình nhà trường</p><h1 className="mt-2 text-2xl font-extrabold text-ink">Thiết lập và bảo vệ thông tin</h1><p className="mt-4 leading-7 text-slate-700">Tài khoản nhân sự được quản lý trong bảng staff_users và đăng nhập bằng email riêng. Quản trị viên chỉ xác minh số điện thoại sau khi nhà trường/giáo viên xác nhận thông tin và sự đồng ý công khai. Mọi thay đổi thông tin liên hệ đều hủy trạng thái xác minh cũ và ẩn số điện thoại/email cho đến khi xác minh lại.</p><p className="mt-3 leading-7 text-slate-700">Để thiết lập tài khoản đầu tiên, hãy áp dụng migration 002 rồi dùng lệnh <code>npm run staff:create</code> trên máy chủ có quyền database. Không dùng tài khoản chia sẻ cho môi trường thật.</p><p className="mt-3 text-sm text-slate-500">Đang đăng nhập: {actor.email} · vai trò: {actor.role}</p></div></div>;
}
