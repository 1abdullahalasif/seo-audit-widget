// src/components/audit/results/ScoreCard.tsx
import React from 'react';
import type { ScoreItem } from 'src/types/ScoreItem';

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore: number;
  items: ScoreItem[];
  className?: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ 
  title, 
  score, 
  maxScore, 
  items,
  className = ''
}) => {
  const percentage = Math.round((score / maxScore) * 100);
  
  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: ScoreItem['status']) => {
    const baseClasses = 'text-xs px-2 py-1 rounded-full';
    switch (status) {
      case 'pass':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'fail':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getScoreColor(percentage)}`}>
            {percentage}%
          </div>
          <div className="text-sm text-gray-500">
            {score}/{maxScore} points
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                <span className={getStatusBadge(item.status)}>
                  {item.score}/{item.maxScore}
                </span>
              </div>
              {item.details && (
                <p className="text-xs text-gray-500 mt-1">{item.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreCard;