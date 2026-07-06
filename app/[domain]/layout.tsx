import { AppShell } from "@/components/AppShell";

/*
 * Wraps every domain/view page in the persistent shell (brand + tab rows). The
 * shell reads the active domain and view from the pathname, so it survives
 * navigation between views without remounting.
 */
export default function DomainLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
