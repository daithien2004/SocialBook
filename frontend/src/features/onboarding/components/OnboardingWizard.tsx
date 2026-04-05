'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetOnboardingStatusQuery,
  useUpdateOnboardingStepMutation,
  useCompleteOnboardingMutation,
  useStartOnboardingMutation,
} from '../api/onboardingApi';
import { useAppAuth } from '@/features/auth/hooks';
import { useOnboardingStep } from '../hooks/useOnboardingStep';
import StepGenreSelection from './StepGenreSelection';
import StepReadingGoals from './StepReadingGoals';
import StepReadingHabits from './StepReadingHabits';
import StepCompletion from './StepCompletion';
import { ChevronLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export default function OnboardingWizard() {
  const { user, update } = useAppAuth();
  const { data: statusData, isLoading: isStatusLoading } = useGetOnboardingStatusQuery();
  const [updateStep] = useUpdateOnboardingStepMutation();
  const [completeOnboarding] = useCompleteOnboardingMutation();
  const [startOnboarding] = useStartOnboardingMutation();

  const {
    step,
    formData,
    isLoading,
    handleNext,
    handleBack,
  } = useOnboardingStep({
    user,
    update,
    updateStep: async (params) => {
      await updateStep(params).unwrap();
    },
    completeOnboarding: async () => {
      await completeOnboarding().unwrap();
    },
    startOnboarding: async () => {
      await startOnboarding().unwrap();
    },
    statusData,
    isStatusLoading,
  });

  if (step === null || isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl mt-10">
      {/* Back Button */}
      {step > 1 && step < 4 && (
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all mb-6 group px-2 h-8"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm">Quay lại</span>
        </Button>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-3 px-1">
          {['Sở thích', 'Mục tiêu', 'Thói quen', 'Sẵn sàng'].map(
            (label, idx) => (
              <div
                key={label}
                className={`text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${
                  step > idx ? 'text-primary' : 'text-muted-foreground/50'
                }`}
              >
                {label}
              </div>
            )
          )}
        </div>
        <Progress value={(step / 4) * 100} className="h-1.5" />
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <StepGenreSelection
            key="step1"
            onSubmit={handleNext}
            initialData={formData}
          />
        ) : null}
        {step === 2 ? (
          <StepReadingGoals
            key="step2"
            onSubmit={handleNext}
            initialData={formData}
          />
        ) : null}
        {step === 3 ? (
          <StepReadingHabits
            key="step3"
            onSubmit={handleNext}
            initialData={formData}
          />
        ) : null}
        {step === 4 ? <StepCompletion key="step4" onSubmit={handleNext} /> : null}
      </AnimatePresence>
    </div>
  );
}
