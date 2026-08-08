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
    <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-57px)] w-full overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 bg-zinc-950">
      {/* Left scrollable control panel */}
      <div className="h-full overflow-y-auto p-6 md:p-8 flex flex-col gap-6">
        {leftControlPanel}
      </div>

      {/* Right verdict visual dashboard */}
      <div className="h-full overflow-hidden relative flex flex-col">
        {rightVerdictPanel}
      </div>
    </div>
  );
};
