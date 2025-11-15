import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Wallet, CheckCircle } from 'lucide-react';

interface InitialSetupProps {
  onComplete: () => void;
}

export function InitialSetup({ onComplete }: InitialSetupProps) {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [setupStep, setSetupStep] = useState('Initializing...');
  
  const isFirstTime = useQuery(api.users.isFirstTimeUser);
  const createDefaultCategories = useMutation(api.categories.createDefaultCategories);
  
  const runInitialSetup = useCallback(async () => {
    try {
      setSetupStep('Creating default categories...');
      await createDefaultCategories();

      setSetupStep('Setup complete!');
      setIsSetupComplete(true);

      // Wait a moment to show success, then complete
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Setup failed:', error);
      setSetupStep('Setup failed. Please refresh and try again.');
    }
  }, [createDefaultCategories, onComplete]);

  useEffect(() => {
    if (isFirstTime === false) {
      // Not a first-time user, skip setup
      onComplete();
      return;
    }

    if (isFirstTime === true) {
      // First-time user, run setup
      void runInitialSetup();
    }
  }, [isFirstTime, onComplete, runInitialSetup]);
  
  if (isFirstTime === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="p-4 bg-primary-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            {isSetupComplete ? (
              <CheckCircle className="h-10 w-10 text-green-600" />
            ) : (
              <Wallet className="h-10 w-10 text-primary-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Expense Tracker!
          </h1>
          <p className="text-gray-600">
            We're setting up your account with default categories and settings.
          </p>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">{setupStep}</p>
          {!isSetupComplete && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full transition-all duration-300 animate-pulse w-2/3"></div>
            </div>
          )}
        </div>
        
        {isSetupComplete && (
          <div className="text-green-600 text-sm">
            ✅ Your expense tracker is ready to use!
          </div>
        )}
      </div>
    </div>
  );
}