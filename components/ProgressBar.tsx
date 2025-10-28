
import React from 'react';

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  const color = percentage < 30 ? 'bg-status-red' : percentage < 70 ? 'bg-status-yellow' : 'bg-status-green';
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`${color} h-2.5 rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      ></div>
       <span className="text-xs font-medium text-gray-600 ml-2">{percentage}%</span>
    </div>
  );
};

export default ProgressBar;
