import { SiteShell } from '@/components/shell';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
