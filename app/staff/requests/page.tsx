import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { StaffRequestList } from '@/components/staff-request-list';
import { redirect } from 'next/navigation';
export default async function StaffRequestsPage() {
  const actor = await getCurrentStaffSession();
  if (!actor) redirect('/staff/login');
  if (!staffHasRole(actor, ['super_admin','admin'])) redirect('/staff/dashboard');
  return <div className="page-shell py-10"><p className="eyebrow">Khu vực nhân sự</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Danh sách yêu cầu hỗ trợ</h1><StaffRequestList /></div>;
}
