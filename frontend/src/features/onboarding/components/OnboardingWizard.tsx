'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  useGetOnboardingStatusQuery,
  useUpdateOnboardingStepMutation,
  useCompleteOnboardingMutation,
  useStartOnboardingMutation,
} from '../api/onboardingApi';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useDispatch } from 'react-redux';
import { gamificationApi } from '@/features/gamification/api/gamificationApi';
import StepGenreSelection from './StepGenreSelection';
import StepReadingGoals from './StepReadingGoals';
import StepReadingHabits from './StepReadingHabits';
import StepCompletion from './StepCompletion';
import { toast } from 'sonner';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export default function OnboardingWizard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [step, setStep] = useState<number | null>(null);
  const { data: statusData, isLoading: isStatusLoading } = useGetOnboardingStatusQuery();
  const { user, update } = useAppAuth();

  const [startOnboarding] = useStartOnboardingMutation(); // Init mutation

  useEffect(() => {
    if (user && !user.onboardingId && !user.onboardingCompleted) {
       startOnboarding();
    }
  }, [user, startOnboarding]);

  useEffect(() => {
    if (statusData?.currentStep) {
      setStep(statusData.currentStep);
    } else if (!isStatusLoading && !statusData) {
      setStep(1);
    }
  }, [statusData, isStatusLoading]);

  const [formData, setFormData] = useState({
    favoriteGenres: [],
    readingGoal: { type: 'daily', amount: 10, unit: 'pages' },
    readingTime: {},
  });

  const [updateStep] = useUpdateOnboardingStepMutation();
  const [completeOnboarding] = useCompleteOnboardingMutation();

  const handleNext = async (data: any) => {
    if (step === null) return;
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    try {
      await updateStep({ step, data: updatedData }).unwrap();

      if (step < 4) {
        setStep((prev) => (prev !== null ? prev + 1 : 1));
      } else {
        await completeOnboarding().unwrap();
        await update({ 
          // @ts-ignore
          user: { ...user, onboardingCompleted: true } 
        });
        dispatch(gamificationApi.util.invalidateTags(['GamificationStats', 'Achievements']));
        toast.success('Chào mừng bạn đến với SocialBook!');
        router.replace('/');
      }
    } catch (error) {
      toast.error('Không thể lưu tiến trình');
    }
  };

  const handleBack = () => {
    setStep((prev) => (prev && prev > 1 ? prev - 1 : prev));
  };

  if (step === null) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
