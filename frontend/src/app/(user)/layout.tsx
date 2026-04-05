import { ReactNode } from 'react';
import UserClientLayout from './UserClientLayout';

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <UserClientLayout>{children}</UserClientLayout>;
}
