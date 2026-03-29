import { CompleteOnboardingUseCase } from '@/application/onboarding/use-cases/complete-onboarding.use-case';
import { GetOnboardingStatusUseCase } from '@/application/onboarding/use-cases/get-onboarding-status.use-case';
import { StartOnboardingUseCase } from '@/application/onboarding/use-cases/start-onboarding.use-case';
import { UpdateOnboardingStepUseCase } from '@/application/onboarding/use-cases/update-onboarding-step.use-case';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(
    private readonly getOnboardingStatusUseCase: GetOnboardingStatusUseCase,
    private readonly startOnboardingUseCase: StartOnboardingUseCase,
    private readonly updateOnboardingStepUseCase: UpdateOnboardingStepUseCase,
    private readonly completeOnboardingUseCase: CompleteOnboardingUseCase,
  ) { }

  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return this.getOnboardingStatusUseCase.execute(userId);
  }

  @Post('start')
  async startOnboarding(@CurrentUser('id') userId: string) {
    return this.startOnboardingUseCase.execute(userId);
  }

  @Post('update-step')
  async updateStep(@CurrentUser('id') userId: string, @Body() body: { step: number; data: Record<string, unknown> }) {
    return this.updateOnboardingStepUseCase.execute(userId, body.step, body.data);
  }

  @Post('complete')
  async completeOnboarding(@CurrentUser('id') userId: string) {
    return this.completeOnboardingUseCase.execute(userId);
  }
}
