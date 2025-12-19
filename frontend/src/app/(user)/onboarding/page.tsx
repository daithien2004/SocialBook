import OnboardingWizard from '@/src/features/onboarding/components/OnboardingWizard';

export const metadata = {
  title: 'Welcome to SocialBook',
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col justify-center py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold bg-clip-text bg-gradient-to-r mb-2 dark:text-white text-black">
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
