import React from "react";

export interface PageShellProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "1200";
  className?: string;
  containerClassName?: string;
}

export const PageShell: React.FC<PageShellProps> = ({
  children,
  maxWidth = "1200",
  className = "",
  containerClassName = "",
}) => {
  const maxWClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    "1200": "max-w-[1200px]",
    full: "max-w-full",
  }[maxWidth];

  return (
    <div
      className={`min-h-screen bg-brand-bg text-brand-text font-sans px-2.5 py-6 sm:p-6 md:p-10 lg:p-12 overflow-y-auto w-full ${className}`}
    >
      <div className={`mx-auto w-full ${maxWClasses} ${containerClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default PageShell;
