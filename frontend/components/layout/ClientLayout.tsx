"use client";

import React, { useEffect, useState } from "react";
import { useFleetStore } from "../../lib/store/useFleetStore";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { CopilotDrawer } from "../copilot/CopilotDrawer";
import { OfflineBanner } from "../ui/OfflineBanner";
import { FallbackAuditDrawer } from "../ui/FallbackAuditDrawer";
import { PageBriefingModal } from "../ui/PageBriefingModal";
import { usePathname } from "next/navigation";

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useFleetStore();
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <>
      <OfflineBanner />
      {isDashboard ? (
        <>
          <Header />
          <div className="flex-1 flex">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-5 lg:p-6 max-w-[1920px] w-full mx-auto overflow-y-auto min-h-0">
              {children}
            </main>
          </div>
          <CopilotDrawer />
          <FallbackAuditDrawer />
          <PageBriefingModal />
        </>
      ) : (
        <main className="flex-1 w-full">{children}</main>
      )}
    </>
  );
}
