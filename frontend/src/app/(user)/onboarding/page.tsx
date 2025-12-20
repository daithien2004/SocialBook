import OnboardingWizard from '@/src/features/onboarding/components/OnboardingWizard';

export const metadata = {
  title: 'Welcome to SocialBook',
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] flex flex-col justify-center py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 mb-2 dark:from-indigo-400 dark:to-blue-400">
          SocialBook
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Let's set up your profile
        </p>
      </div>

      <OnboardingWizard />
    </div>
  );
}
