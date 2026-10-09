"use client";

import React, { useEffect } from "react";
import { FinancialProvider, useFinancialContext } from "../context/FinancialContext";
import { Navbar } from "../components/Navbar";
import { BottomNavigation } from "../components/BottomNavigation";
import { SummaryDashboard } from "../components/SummaryDashboard";
import { MovementsView } from "../components/MovementsView";
import { FixedFlowView } from "../components/FixedFlowView";
import { CreditCardsView } from "../components/CreditCardsView";
import { InstallmentsView } from "../components/InstallmentsView";

const DashboardContent: React.FC = () => {
  const { activeView } = useFinancialContext();

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("PWA ServiceWorker registered with scope:", reg.scope))
        .catch((err) => console.log("PWA ServiceWorker registration failed:", err));
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-12">
        {activeView === 'summary' && <SummaryDashboard />}
        {activeView === 'movements' && <MovementsView />}
        {activeView === 'fixed' && <FixedFlowView />}
        {activeView === 'cards' && <CreditCardsView />}
        {activeView === 'installments' && <InstallmentsView />}
      </main>
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500 font-mono mb-16 md:mb-0">
        Gestion de Gastos by Pablo Mirazo v0.1.2
      </footer>
      <BottomNavigation />
    </div>
  );
};

export default function Home() {
  return (
    <FinancialProvider>
      <DashboardContent />
    </FinancialProvider>
  );
}
