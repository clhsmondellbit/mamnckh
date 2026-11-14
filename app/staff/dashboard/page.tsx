import Link from 'next/link';
import { StaffLogoutButton } from '@/components/staff/logout-button';
import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { ContactManager } from '@/components/staff/contact-manager';
import { AppointmentManager } from '@/components/staff/appointment-manager';
import { AvailabilityManager } from '@/components/staff/availability-manager';
import { StaffUserManager } from '@/components/staff/user-manager';
import { AuditList } from '@/components/staff/audit-list';
import { StaffRequestList } from '@/components/staff-request-list';
import { redirect } from 'next/navigation';

export default async function StaffDashboardPage() {
  const actor = await getCurrentStaffSession();
  if (!actor) redirect('/staff/login');
  const canManageDirectory = staffHasRole(actor, ['super_admin','admin']);
  const canSeeAppointments = staffHasRole(actor, ['super_admin','admin','school_counselor','teacher']);
  return <div className="page-shell space-y-9 py-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Khu vực nhân sự · {actor.role}</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Xin chào, {actor.displayName}</h1><p className="mt-2 max-w-2xl leading-7 text-slate-700">Chỉ xem yêu cầu được phân quyền. Nhật ký cá nhân và toàn bộ hội thoại AI của học sinh không nằm trong khu vực này.</p></div><div className="flex items-center gap-2"><Link href="/staff/settings" className="button-secondary">Cấu hình</Link><StaffLogoutButton /></div></div>
    {canManageDirectory ? <section><ContactManager /></section> : null}
    {canManageDirectory ? <StaffUserManager isSuperAdmin={actor.role === 'super_admin'} /> : null}
    {canManageDirectory ? <AuditList /> : null}
    {canSeeAppointments ? <AvailabilityManager ownContactId={actor.supportContactId} canChooseContact={canManageDirectory} /> : null}
    {canSeeAppointments ? <AppointmentManager /> : <p className="card p-5 text-sm text-slate-600">Vai trò hiện tại không có quyền xem yêu cầu tư vấn hoặc lịch hẹn.</p>}
    {staffHasRole(actor, ['super_admin','admin']) ? <section><h2 className="mb-3 text-xl font-bold text-ink">Yêu cầu hỗ trợ khác</h2><StaffRequestList /></section> : null}
  </div>;
}
