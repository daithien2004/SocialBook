import { redirect } from 'next/navigation';
import { Action, Subject, canAccess, defineRulesFor } from '@socialbook/shared';
import { getServerMe } from '@/lib/get-server-me';

export async function requireAdmin(): Promise<void> {
  const me = await getServerMe();
  if (!me) redirect('/login');
  const ability = defineRulesFor(me.role);
  if (!canAccess(ability, Action.Manage, Subject.All)) redirect('/403');
}