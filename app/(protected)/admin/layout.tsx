import { ProtectedGate } from '@/components/guards';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedGate roles={['admin']}>{children}</ProtectedGate>;
}
