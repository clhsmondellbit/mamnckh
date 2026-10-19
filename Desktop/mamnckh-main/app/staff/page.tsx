import { isCurrentStaffAuthenticated } from '@/lib/auth/staff';
import { redirect } from 'next/navigation';

export default async function StaffIndexPage() {
  redirect((await isCurrentStaffAuthenticated()) ? '/staff/dashboard' : '/staff/login');
}
