import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '../../components/onboarding/OnboardingShell';
import GetStartedScreen from '../../components/onboarding/GetStartedScreen';
import PainPointScreen from '../../components/onboarding/PainPointScreen';
import DemoScreen from '../../components/onboarding/DemoScreen';
import { prefs } from '../../lib/prefs';

export default function Onboarding() {
  const [step, setStep] = useState(0);

  const finish = async () => {
    await prefs.setOnboarded(true);
    router.replace('/(home)/Log');
  };

  if (step === 0) {
    return (
      <OnboardingShell
        step={step}
        title="Spenda"
        primaryLabel="Get Started"
        onPrimary={() => setStep(1)}
        onSkip={finish}
      >
        <GetStartedScreen />
      </OnboardingShell>
    );
  }

  if (step === 1) {
    return (
      <OnboardingShell
        step={step}
        title="Why Spenda"
        primaryLabel="Next"
        onPrimary={() => setStep(2)}
        onBack={() => setStep(0)}
        onSkip={finish}
      >
        <PainPointScreen />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={step}
      title="This is logging"
      primaryLabel="Start logging"
      onPrimary={finish}
      onBack={() => setStep(1)}
    >
      <DemoScreen />
    </OnboardingShell>
  );
}
