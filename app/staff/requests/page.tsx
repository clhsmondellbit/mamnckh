import { isCurrentStaffAuthenticated } from '@/lib/auth/staff';
import { StaffRequestList } from '@/components/staff-request-list';
import { redirect } from 'next/navigation';

export default async function StaffRequestsPage() {
  if (!(await isCurrentStaffAuthenticated())) redirect('/staff/login');
  return <div className="page-shell py-10"><p className="eyebrow">Khu vực nhân sự</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Danh sách yêu cầu hỗ trợ</h1><StaffRequestList /></div>;
}
