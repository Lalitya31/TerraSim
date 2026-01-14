import React from 'react';
import ConnectionIndicator from './ConnectionIndicator';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-[#4a7c5c] to-[#5a8c6c] text-white shadow-lg">
      <div className="max-w-full px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TerraSim</h1>
            <p className="text-sm text-gray-200 mt-1">Climate Risk Engine</p>
          </div>
          <ConnectionIndicator />
        </div>
      </div>
    </header>
  );
};

export default Header;
