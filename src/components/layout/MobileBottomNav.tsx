/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Sparkles, Users, Briefcase, GitFork } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'الرئيسية', icon: Home },
    { to: '/services', label: 'خدماتنا', icon: Sparkles },
    { to: '/team', label: 'فريقنا', icon: Users },
    { to: '/organization', label: 'الهيكل', icon: GitFork },
    { to: '/careers', label: 'الوظائف', icon: Briefcase },
  ];

  return (
    <nav
      aria-label="شريط التنقل السفلي للهواتف المحمولة"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A192F]/95 backdrop-blur-md border-t border-[#1E3A8A]/50 shadow-[0_-4px_20px_rgba(10,25,47,0.3)] pb-safe"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 px-1 transition-all relative ${
                isActive ? 'text-[#00D2FF]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {/* Active top glow indicator */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-[#00D2FF] rounded-b-full shadow-[0_2px_8px_#00D2FF]" />
              )}

              <div
                className={`p-1 rounded-lg transition-transform ${
                  isActive ? 'scale-110 bg-[#1E3A8A]/40' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <span
                className={`text-[11px] font-bold mt-0.5 tracking-tight ${
                  isActive ? 'text-[#00D2FF] font-black' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
