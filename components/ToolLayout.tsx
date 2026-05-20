import { ReactNode } from "react";
import ToolHeaderActions from "./ToolHeaderActions";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-[#222222] px-6 py-5">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-[#f5f5f5]">{title}</h1>
          <ToolHeaderActions />
        </div>
        <p className="text-sm text-[#888888] mt-0.5">{description}</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
