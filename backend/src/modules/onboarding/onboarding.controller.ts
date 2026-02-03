import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) { }

  @Get('status')
  getStatus(@Req() req: Request & { user: { id: string } }) {
    return this.onboardingService.getOnboardingStatus(req.user.id);
  }

  @Post('start')
  startOnboarding(@Req() req: Request & { user: { id: string } }) {
    return this.onboardingService.startOnboarding(req.user.id);
  }

  @Post('update-step')
  updateStep(@Req() req: Request & { user: { id: string } }, @Body() body: { step: number; data: Record<string, unknown> }) {
    return this.onboardingService.updateStep(req.user.id, body.step, body.data);
  }

  @Post('complete')
  completeOnboarding(@Req() req: Request & { user: { id: string } }) {
    return this.onboardingService.completeOnboarding(req.user.id);
  }
}
