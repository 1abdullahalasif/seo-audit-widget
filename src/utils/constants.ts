// src/utils/constants.ts
export const SCORE_THRESHOLDS = {
    EXCELLENT: 90,
    GOOD: 70,
    POOR: 0
  };
  
  export const AUDIT_WEIGHTS = {
    technical: 0.4,  // 40%
    onPage: 0.4,     // 40%
    offPage: 0.2     // 20%
  };
  
  export const MAX_POLL_ATTEMPTS = 30; // 1 minute (30 * 2 seconds)
  export const POLL_INTERVAL = 2000; // 2 seconds
  export const HEALTH_CHECK_INTERVAL = 300000; // 5 minutes