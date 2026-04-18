import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { gamificationApi } from '@/features/gamification/api/gamificationApi';

interface OnboardingFormData {
    favoriteGenres: string[];
    readingGoal: { type: string; amount: number; unit: string };
    readingTime: Record<string, unknown>;
}

interface UseOnboardingStepOptions {
    user?: { onboardingId?: string; onboardingCompleted?: boolean } | null;
    update: (params: { user: Record<string, unknown> }) => void;
    updateStep: (params: { step: number; data: OnboardingFormData }) => Promise<void>;
    completeOnboarding: () => Promise<void>;
    startOnboarding: () => Promise<void>;
    statusData?: { currentStep?: number } | null;
    isStatusLoading: boolean;
}

export interface UseOnboardingStepResult {
    step: number | null;
    formData: OnboardingFormData;
    isLoading: boolean;
    handleNext: (data: Partial<OnboardingFormData>) => Promise<void>;
    handleBack: () => void;
    setFormData: (data: OnboardingFormData) => void;
}

export function useOnboardingStep({
    user,
    update,
    updateStep,
    completeOnboarding,
    startOnboarding,
    statusData,
    isStatusLoading,
}: UseOnboardingStepOptions): UseOnboardingStepResult {
    const router = useRouter();
    const dispatch = useDispatch();
    const [step, setStep] = useState<number | null>(null);
    const [formData, setFormData] = useState<OnboardingFormData>({
        favoriteGenres: [],
        readingGoal: { type: 'daily', amount: 10, unit: 'pages' },
        readingTime: {},
    });

    const hasStartedRef = useRef(false);

    useEffect(() => {
        if (user && !user.onboardingId && !user.onboardingCompleted && !hasStartedRef.current) {
            hasStartedRef.current = true;
            startOnboarding().catch((err) => {
                hasStartedRef.current = false;
                console.error(err);
            });
        }
    }, [user, startOnboarding]);

    useEffect(() => {
        if (statusData?.currentStep) {
            setStep(statusData.currentStep);
        } else if (!isStatusLoading && !statusData) {
            setStep(1);
        }
    }, [statusData, isStatusLoading]);

    const handleNext = useCallback(async (data: Partial<OnboardingFormData>) => {
        if (step === null) return;
        const updatedData = { ...formData, ...data };
        setFormData(updatedData);

        try {
            await updateStep({ step, data: updatedData });

            if (step < 4) {
                setStep((prev) => (prev !== null ? prev + 1 : 1));
            } else {
                await completeOnboarding();
                await update({
                    user: { ...user, onboardingCompleted: true } as Record<string, unknown>,
                });
                dispatch(gamificationApi.util.invalidateTags(['GamificationStats', 'Achievements']));
                toast.success('Chào mừng bạn đến với SocialBook!');
                router.replace('/');
            }
        } catch (error) {
            toast.error('Không thể lưu tiến trình');
        }
    }, [step, formData, updateStep, completeOnboarding, update, user, dispatch, router]);

    const handleBack = useCallback(() => {
        setStep((prev) => (prev && prev > 1 ? prev - 1 : prev));
    }, []);

    return {
        step,
        formData,
        isLoading: step === null,
        handleNext,
        handleBack,
        setFormData,
    };
}
