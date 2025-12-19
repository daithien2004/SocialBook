export interface OnboardingStatus {
  isCompleted: boolean;
  currentStep: number;
}

export interface UpdateStepDto {
  step: number;
  data: any;
}
