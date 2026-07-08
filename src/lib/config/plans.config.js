export const PLANS = {
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    priceKsh: 0,
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
  // Always return unlimited
  return PLANS.unlimited;
}

export function hasFeature(planId, feature) {
  const plan = getPlanConfig(planId);
  return plan.features.includes(feature);
}

export function canAddBranch(planId, currentBranchCount) {
  const plan = getPlanConfig(planId);
  return currentBranchCount < plan.branchLimit;
}
