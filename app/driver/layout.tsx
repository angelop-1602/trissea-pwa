import { RoleGate } from '@/components/role-gate';

export default function DriverLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RoleGate role="driver">{children}</RoleGate>;
}
