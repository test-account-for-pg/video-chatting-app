import React from 'react';

interface StatusIndicatorProps {
  isConnected: boolean;
  isWaiting: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  error: string | null;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isConnected,
  isWaiting,
  isMuted,
  isVideoEnabled,
  error
}) => {
  const getStatusText = () => {
    if (error) return `Error: ${error}`;
    if (isConnected) return 'Connected';
    if (isWaiting) return 'Waiting for stranger...';
    return 'Ready to connect';
  };

  const getStatusColor = () => {
    if (error) return 'text-red-400';
    if (isConnected) return 'text-green-400';
    if (isWaiting) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="status-indicator">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            error ? 'bg-red-400' : 
            isConnected ? 'bg-green-400' : 
            isWaiting ? 'bg-yellow-400' : 'bg-gray-400'
          }`}></div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        {/* Media status indicators */}
        <div className="flex items-center space-x-2">
          {isMuted && (
            <div className="flex items-center space-x-1 text-red-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L5.5 14H3a1 1 0 01-1-1V7a1 1 0 011-1h2.5l2.883-2.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">Muted</span>
            </div>
          )}
          
          {!isVideoEnabled && (
            <div className="flex items-center space-x-1 text-red-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
              <span className="text-xs">Camera Off</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
