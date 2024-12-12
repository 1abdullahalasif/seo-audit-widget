export interface ScoreItem {
    name: string;
    status: 'pass' | 'warning' | 'fail';
    score: number;
    maxScore: number;
    details?: string;
  }
  
  export interface ScoreBreakdown {
    score: number;
    maxScore: number;
    items: ScoreItem[];
  }