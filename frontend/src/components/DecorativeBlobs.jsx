import React from 'react';

const DecorativeBlobs = () => {
  return (
    <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
      </defs>
      <g opacity="0.6">
        <ellipse cx="80" cy="520" rx="220" ry="120" fill="url(#g1)" transform="rotate(-30 80 520)" />
        <ellipse cx="720" cy="80" rx="260" ry="140" fill="#fff7ed" opacity="0.9" transform="rotate(20 720 80)" />
        <ellipse cx="420" cy="320" rx="300" ry="200" fill="#f0f9ff" opacity="0.7" />
      </g>
    </svg>
  );
};

export default DecorativeBlobs;
