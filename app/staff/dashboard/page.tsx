import Link from 'next/link';
import { isCurrentStaffAuthenticated } from '@/lib/auth/staff';
import { StaffRequestList } from '@/components/staff-request-list';
import { redirect } from 'next/navigation';

export default async function StaffDashboardPage() {
  if (!(await isCurrentStaffAuthenticated())) redirect('/staff/login');
  return <div className="page-shell py-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Khu vực nhân sự</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Yêu cầu hỗ trợ tự nguyện</h1><p className="mt-2 max-w-2xl leading-7 text-slate-700">Đây không phải bảng theo dõi học sinh. Chỉ các yêu cầu học sinh chủ động gửi mới hiển thị; không có toàn bộ nội dung chat.</p></div><Link href="/staff/requests" className="button-secondary">Danh sách yêu cầu</Link></div><StaffRequestList /></div>;
}
