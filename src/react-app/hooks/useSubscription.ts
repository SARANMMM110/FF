import { useState, useEffect } from 'react';

interface SubscriptionData {
  plan_id: string;
  is_pro: boolean;
  is_enterprise: boolean;
  is_free: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/subscription');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError(err as Error);
      // Default to free plan on error
      setSubscription({
        plan_id: 'free',
        is_pro: false,
        is_enterprise: false,
        is_free: true
      });
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchSubscription();
  };

  return {
    subscription,
    loading,
    error,
    refresh,
    isPro: subscription?.is_pro || false,
    isEnterprise: subscription?.is_enterprise || false,
    isFree: subscription?.is_free ?? true,
    planId: subscription?.plan_id || 'free'
  };
}
