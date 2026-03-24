import { redirect } from 'next/navigation';

export default function AdminManageRoute() {
  redirect('/admin?section=companies');
}
