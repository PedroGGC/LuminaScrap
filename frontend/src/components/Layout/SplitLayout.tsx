import React from 'react';

interface SplitLayoutProps {
  leftControlPanel: React.ReactNode;
  rightVerdictPanel: React.ReactNode;
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({
  leftControlPanel,
  rightVerdictPanel,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-61px)] w-full overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[#1b2030] bg-[#07090e] relative">
      {/* Ambient Glow in Background */}
      <div className="absolute inset-0 bg-ambient-glow pointer-events-none"></div>

      {/* Left scrollable control panel */}
      <div className="h-full overflow-y-auto p-5 md:p-7 flex flex-col gap-6 custom-scrollbar relative z-10">
        {leftControlPanel}
      </div>

      {/* Right verdict visual dashboard */}
      <div className="h-full overflow-hidden relative flex flex-col z-10 bg-[#090c14]/50">
        {rightVerdictPanel}
      </div>
    </div>
  );
};

