import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
// import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'; // Ensure you have swagger if used
import { GetOnboardingStatusUseCase } from '@/application/onboarding/use-cases/get-onboarding-status.use-case';
import { StartOnboardingUseCase } from '@/application/onboarding/use-cases/start-onboarding.use-case';
import { UpdateOnboardingStepUseCase } from '@/application/onboarding/use-cases/update-onboarding-step.use-case';
import { CompleteOnboardingUseCase } from '@/application/onboarding/use-cases/complete-onboarding.use-case';

@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly getOnboardingStatusUseCase: GetOnboardingStatusUseCase,
    private readonly startOnboardingUseCase: StartOnboardingUseCase,
    private readonly updateOnboardingStepUseCase: UpdateOnboardingStepUseCase,
    private readonly completeOnboardingUseCase: CompleteOnboardingUseCase,
  ) { }

  @Get('status')
  async getStatus(@Req() req: Request & { user: { id: string } }) {
    return this.getOnboardingStatusUseCase.execute(req.user.id);
  }

  @Post('start')
  async startOnboarding(@Req() req: Request & { user: { id: string } }) {
    return this.startOnboardingUseCase.execute(req.user.id);
  }

  @Post('update-step')
  async updateStep(@Req() req: Request & { user: { id: string } }, @Body() body: { step: number; data: Record<string, unknown> }) {
    return this.updateOnboardingStepUseCase.execute(req.user.id, body.step, body.data);
  }

  @Post('complete')
  async completeOnboarding(@Req() req: Request & { user: { id: string } }) {
    return this.completeOnboardingUseCase.execute(req.user.id);
  }
}
