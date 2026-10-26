import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  desktopHeader?: React.ReactNode;
  pageBack?: React.ReactNode;
  bottomNav?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  header,
  desktopHeader,
  pageBack,
  bottomNav,
}) => (
  <div className="app-shell relative flex min-h-dvh w-full flex-col overflow-x-clip bg-[#F8F7F2] text-[#24352B] selection:bg-[#124B3A] selection:text-white">
    {desktopHeader && <div className="relative z-[100] hidden lg:block">{desktopHeader}</div>}
    <div className={`app-workspace flex min-h-0 min-w-0 flex-1 flex-col ${bottomNav ? 'pb-[calc(7.5rem+env(safe-area-inset-bottom))]' : ''}`}>
      {header && <div className="relative z-[100] w-full lg:hidden">{header}</div>}
      <main className="app-main relative z-0 flex min-h-0 flex-1 flex-col overflow-x-clip">
        {pageBack}
        {children}
      </main>
    </div>
    {bottomNav && (
      <div className="fixed inset-x-0 bottom-[calc(12px+env(safe-area-inset-bottom))] z-[100] flex w-full justify-center px-3 sm:bottom-[calc(20px+env(safe-area-inset-bottom))] sm:px-4">
        {bottomNav}
      </div>
    )}
  </div>
);

export default AppShell;
