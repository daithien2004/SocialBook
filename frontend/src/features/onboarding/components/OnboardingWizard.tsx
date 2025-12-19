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
import { useSession } from 'next-auth/react';
import { useDispatch } from 'react-redux';
import { gamificationApi } from '@/src/features/gamification/api/gamificationApi';
import StepGenreSelection from './StepGenreSelection';
import StepReadingGoals from './StepReadingGoals';
import StepReadingHabits from './StepReadingHabits';
import StepCompletion from './StepCompletion';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

export default function OnboardingWizard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [step, setStep] = useState<number | null>(null);
  const { data: statusData, isLoading: isStatusLoading } = useGetOnboardingStatusQuery();
  const { data: session, update } = useSession();

  const [startOnboarding] = useStartOnboardingMutation(); // Init mutation

  useEffect(() => {
    if (session?.user && !session.user.onboardingId && !session.user.onboardingCompleted) {
       startOnboarding();
    }
  }, [session, startOnboarding]);

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
        setStep(step + 1);
      } else {
        await completeOnboarding().unwrap();
        await update({ ...session, user: { ...session?.user, onboardingCompleted: true } });
        dispatch(gamificationApi.util.invalidateTags(['GamificationStats', 'Achievements']));
        toast.success('Welcome to SocialBook!');
        router.replace('/');
      }
    } catch (error) {
      toast.error('Failed to save progress');
    }
  };

  const handleBack = () => {
    if (step && step > 1) {
      setStep(step - 1);
    }
  };

  if (step === null) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
           <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
        </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl mt-10">
      {/* Back Button */}
      {step > 1 && step < 4 && (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-6 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Quay lại</span>
        </button>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {['Sở thích', 'Mục tiêu', 'Thói quen', 'Sẵn sàng'].map(
            (label, idx) => (
              <div
                key={label}
                className={`text-sm font-medium ${
                  step > idx ? 'text-black dark:text-white' : 'text-gray-400'
                }`}
              >
                {label}
              </div>
            )
          )}
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-black dark:bg-white"
            initial={{ width: `${((step - 1) / 4) * 100}%` }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <StepGenreSelection
            key="step1"
            onSubmit={handleNext}
            initialData={formData}
          />
        )}
        {step === 2 && (
          <StepReadingGoals
            key="step2"
            onSubmit={handleNext}
            initialData={formData}
          />
        )}
        {step === 3 && (
          <StepReadingHabits
            key="step3"
            onSubmit={handleNext}
            initialData={formData}
          />
        )}
        {step === 4 && <StepCompletion key="step4" onSubmit={handleNext} />}
      </AnimatePresence>
    </div>
  );
}
