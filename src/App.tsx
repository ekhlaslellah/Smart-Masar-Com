/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/pages/HomePage';
import { AboutPage } from './components/pages/AboutPage';
import { ServicesPage } from './components/pages/ServicesPage';
import { TeamPage } from './components/pages/TeamPage';
import { OrgChartPage } from './components/pages/OrgChartPage';
import { CareersPage } from './components/pages/CareersPage';
import { ContactPage } from './components/pages/ContactPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { EmployeeModal } from './components/common/EmployeeModal';
import { CheckCircle2 } from 'lucide-react';

/**
 * Automatically scrolls viewport to top upon page navigation.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

const ToastContainer: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-6 z-50 bg-[#0A192F] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#00D2FF]/40 flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-2">
      <CheckCircle2 className="w-4 h-4 text-[#00D2FF] shrink-0" />
      <span>{toastMessage}</span>
    </div>
  );
};

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F0F6FD] text-[#0E1E38] font-sans antialiased">
      <Navbar />
      {/* pb-24 on mobile ensures the bottom navigation bar never covers page content */}
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <EmployeeModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Separate Administration Application Route */}
          <Route path="/admin/*" element={<AdminLayout />} />

          {/* Multi-Page Public Website Routes */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
          <Route
            path="/about"
            element={
              <PublicLayout>
                <AboutPage />
              </PublicLayout>
            }
          />
          <Route
            path="/services"
            element={
              <PublicLayout>
                <ServicesPage />
              </PublicLayout>
            }
          />
          <Route
            path="/team"
            element={
              <PublicLayout>
                <TeamPage />
              </PublicLayout>
            }
          />
          <Route
            path="/organization"
            element={
              <PublicLayout>
                <OrgChartPage />
              </PublicLayout>
            }
          />
          <Route
            path="/careers"
            element={
              <PublicLayout>
                <CareersPage />
              </PublicLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <PublicLayout>
                <ContactPage />
              </PublicLayout>
            }
          />

          {/* Fallback to Home */}
          <Route
            path="*"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}
