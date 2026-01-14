import React from 'react';
import { useConnection } from '../context/ConnectionContext';

const ConnectionIndicator = ({ showText = false }) => {
  const { status, connect, lastError } = useConnection();

  const color = status === 'connected' ? 'bg-green-400' : status === 'connecting' ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color} shadow`}></div>
      {showText && <div className="text-sm text-gray-700">{status}</div>}
      {status !== 'connected' && (
        <button className="ml-2 text-sm text-blue-600 underline" onClick={() => connect({ manual: true })}>
          Retry
        </button>
      )}
      {lastError && status !== 'connected' && (
        <div className="ml-3 text-xs text-red-600">{lastError}</div>
      )}
    </div>
  );
};

export default ConnectionIndicator;
