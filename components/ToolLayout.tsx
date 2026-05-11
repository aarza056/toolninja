import { ReactNode } from "react";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#222222] px-6 py-5">
        <h1 className="text-lg font-semibold text-[#f5f5f5]">{title}</h1>
        <p className="text-sm text-[#888888] mt-0.5">{description}</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
