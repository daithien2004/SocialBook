import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) { }

  @Get('status')
  getStatus(@Req() req) {
    return this.onboardingService.getOnboardingStatus(req.user.id);
  }

  @Post('start')
  startOnboarding(@Req() req) {
    return this.onboardingService.startOnboarding(req.user.id);
  }

  @Post('update-step')
  updateStep(@Req() req, @Body() body) {
    return this.onboardingService.updateStep(req.user.id, body.step, body.data);
  }

  @Post('complete')
  completeOnboarding(@Req() req) {
    return this.onboardingService.completeOnboarding(req.user.id);
  }
}
