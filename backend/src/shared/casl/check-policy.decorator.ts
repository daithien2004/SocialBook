import { SetMetadata } from '@nestjs/common';
import type { AppAction, AppSubject } from './app-ability';

export const CHECK_POLICY = 'check-policy';

export interface CheckPolicyMetadata {
  readonly action: AppAction;
  readonly subject: AppSubject;
}

export const CheckPolicy = (action: AppAction, subject: AppSubject) =>
  SetMetadata(CHECK_POLICY, { action, subject } satisfies CheckPolicyMetadata);
