import { ProtectedShell } from '@/components/shell';
import { ProtectedGate } from '@/components/guards';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedShell>
      <ProtectedGate>{children}</ProtectedGate>
    </ProtectedShell>
  );
}
