import { StaffLoginForm } from '@/components/staff-login-form';

export default function StaffLoginPage() {
  return <div className="page-shell py-12"><div className="mx-auto max-w-md"><p className="eyebrow">Khu vực nhân sự</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Đăng nhập an toàn</h1><p className="mt-3 leading-7 text-slate-700">Chỉ nhân sự được nhà trường phân quyền mới được sử dụng khu vực này. Không dùng tài khoản học sinh.</p><StaffLoginForm /></div></div>;
}
