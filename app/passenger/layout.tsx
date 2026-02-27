import { RoleGate } from '@/components/role-gate';

export default function PassengerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RoleGate role="passenger">{children}</RoleGate>;
}
