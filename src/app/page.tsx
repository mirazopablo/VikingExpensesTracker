"use client";

import React from "react";
import { FinancialProvider, useFinancialContext } from "../context/FinancialContext";
import { Navbar } from "../components/Navbar";
import { SummaryDashboard } from "../components/SummaryDashboard";
import { MovementsView } from "../components/MovementsView";
import { FixedFlowView } from "../components/FixedFlowView";
import { CreditCardsView } from "../components/CreditCardsView";
import { InstallmentsView } from "../components/InstallmentsView";

const DashboardContent: React.FC = () => {
  const { activeView } = useFinancialContext();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'summary' && <SummaryDashboard />}
        {activeView === 'movements' && <MovementsView />}
        {activeView === 'fixed' && <FixedFlowView />}
        {activeView === 'cards' && <CreditCardsView />}
        {activeView === 'installments' && <InstallmentsView />}
      </main>
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500 font-mono">
        Motor de Gestión Viking Expenses • Next.js App Router • Hidratación SSR Bimoneda
      </footer>
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
