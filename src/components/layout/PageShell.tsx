import React, { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
}

const PageShell: React.FC<PageShellProps> = ({ children }) => {
  return (
    <div className="w-full">
      <div className="w-full">
        <div className="p-2 sm:p-4">
          <div className="w-full max-w-6xl mx-auto flex flex-col gap-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageShell;