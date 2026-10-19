import { isCurrentStaffAuthenticated } from '@/lib/auth/staff';
import { redirect } from 'next/navigation';

export default async function StaffSettingsPage() {
  if (!(await isCurrentStaffAuthenticated())) redirect('/staff/login');
  return <div className="page-shell py-10"><div className="card mx-auto max-w-3xl p-7"><p className="eyebrow">Cấu hình nhà trường</p><h1 className="mt-2 text-2xl font-extrabold text-ink">Thiết lập trước khi công bố</h1><p className="mt-4 leading-7 text-slate-700">Thông tin liên hệ, quy trình chuyển tuyến, thời hạn lưu giữ, phân quyền nhân sự và nội dung tài nguyên phải được nhà trường xác minh trước khi đưa vào MẦM. Phiên bản MVP này đọc cấu hình triển khai qua biến môi trường; không có dữ liệu liên hệ giả để chỉnh sửa trong giao diện.</p></div></div>;
}
