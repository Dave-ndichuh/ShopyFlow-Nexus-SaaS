export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter Retail',
    priceKsh: 5000,
    branchLimit: 1,
    features: [
      'basic_shifts',
      'pos'
    ]
  },
  business_pro: {
    id: 'business_pro',
    name: 'Business Pro',
    priceKsh: 15000,
    branchLimit: 5,
    features: [
      'basic_shifts',
      'pos',
      'cash_management',
      'analytics'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceKsh: 30000,
    branchLimit: 9999, // Unlimited
    features: [
      'basic_shifts',
      'pos',
      'cash_management',
      'analytics',
      'loss_prevention',
      'erp_suite'
    ]
  }
};

export function getPlanConfig(planId) {
  // Default to starter if planId is missing or invalid
  if (!planId || !PLANS[planId]) {
    return PLANS.starter;
  }
  return PLANS[planId];
}

export function hasFeature(planId, feature) {
  const plan = getPlanConfig(planId);
  return plan.features.includes(feature);
}

export function canAddBranch(planId, currentBranchCount) {
  const plan = getPlanConfig(planId);
  return currentBranchCount < plan.branchLimit;
}
