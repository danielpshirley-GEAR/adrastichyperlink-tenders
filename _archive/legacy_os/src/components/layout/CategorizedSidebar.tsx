"use client";

import React from "react";
import {
  Compass,
  Flame,
  Zap,
  TrendingUp,
  Building2,
  Cpu,
  Layers,
  FileCode,
  FileCheck,
  Award,
  Users,
  Briefcase,
  Share2,
  Kanban,
  Contact2,
  FileText,
  Search,
  Radio,
  BarChart3,
  Clock,
  Sparkles,
  Coins,
  Settings as SettingsIcon,
} from "lucide-react";

export type WorkspaceId =
  | "today"
  | "active_buyers"
  | "business_signals"
  | "internal_needs"
  | "in_house_capacity"
  | "agency_overflow"
  | "commissions_rfps"
  | "public_tenders"
  | "frameworks"
  | "recruiters_freelance"
  | "partners_multipliers"
  | "inbound_authority"
  | "client_expansion"
  | "pipeline"
  | "companies"
  | "contacts"
  | "proposals"
  | "calendar"
  | "research_centre"
  | "sources_schedules"
  | "analytics"
  | "ai_costs"
  | "settings";

export interface SidebarItem {
  id: WorkspaceId;
  label: string;
  sub: string;
  icon: any;
  accent?: string;
  badge?: string;
  badgeColor?: string;
}

export interface SidebarSection {
  category: string;
  items: SidebarItem[];
}

interface CategorizedSidebarProps {
  activeWorkspace: WorkspaceId;
  onSelectWorkspace: (id: WorkspaceId) => void;
  urgentCount: number;
  mode: "demo" | "live";
}

export function CategorizedSidebar({
  activeWorkspace,
  onSelectWorkspace,
  urgentCount,
  mode,
}: CategorizedSidebarProps) {
  const sections: SidebarSection[] = [
    {
      category: "TODAY",
      items: [
        {
          id: "today",
          label: "Today",
          sub: "Customer Acquisition Programme",
          icon: Compass,
          badge: urgentCount > 0 ? `${urgentCount} Urgent` : undefined,
          badgeColor: "bg-rose-600 text-white font-semibold",
        },
      ],
    },
    {
      category: "FIND CLIENTS",
      items: [
        {
          id: "active_buyers",
          label: "Active Buyers",
          sub: "Explicit Buying Demand (<1h)",
          icon: Flame,
          accent: "text-rose-600",
          badge: "Live",
          badgeColor: "bg-rose-50 text-rose-700 border border-rose-200 font-semibold",
        },
        {
          id: "business_signals",
          label: "Business Signals",
          sub: "Funding & Stacked Triggers",
          icon: TrendingUp,
          accent: "text-sky-600",
        },
        {
          id: "internal_needs",
          label: "Internal Needs",
          sub: "Comms & Transformation",
          icon: Building2,
          accent: "text-emerald-600",
        },
        {
          id: "in_house_capacity",
          label: "In-House Capacity",
          sub: "Marketing vs Design Gaps",
          icon: Cpu,
          accent: "text-amber-600",
        },
        {
          id: "agency_overflow",
          label: "Agency Opportunities",
          sub: "Overflow & Production Support",
          icon: Layers,
          accent: "text-violet-600",
        },
      ],
    },
    {
      category: "OPEN WORK",
      items: [
        {
          id: "commissions_rfps",
          label: "Commissions & RFPs",
          sub: "Private Pitches & Briefs",
          icon: FileCode,
          accent: "text-indigo-600",
        },
        {
          id: "public_tenders",
          label: "Public Tenders",
          sub: "Government & Bid Evaluation",
          icon: FileCheck,
          accent: "text-blue-600",
        },
        {
          id: "frameworks",
          label: "Frameworks",
          sub: "Approved Supplier Rosters",
          icon: Award,
          accent: "text-teal-600",
        },
        {
          id: "recruiters_freelance",
          label: "Freelance & Recruiters",
          sub: "Fast Production Cash Flow",
          icon: Briefcase,
          accent: "text-fuchsia-600",
        },
      ],
    },
    {
      category: "BUILD NETWORK",
      items: [
        {
          id: "partners_multipliers",
          label: "Partners & Multipliers",
          sub: "VC, PE & Fractional CMOs",
          icon: Share2,
          accent: "text-rose-600",
        },
      ],
    },
    {
      category: "GROW",
      items: [
        {
          id: "inbound_authority",
          label: "Inbound",
          sub: "SEO, Authority & Inquiries",
          icon: Sparkles,
          accent: "text-lime-600",
        },
        {
          id: "client_expansion",
          label: "Client Expansion",
          sub: "Repeat Scope & Retainers",
          icon: Users,
          accent: "text-amber-600",
        },
      ],
    },
    {
      category: "SALES (DOWNSTREAM)",
      items: [
        {
          id: "pipeline",
          label: "Pipeline",
          sub: "Active Deals & Proposals",
          icon: Kanban,
          accent: "text-slate-600",
        },
        {
          id: "companies",
          label: "Companies",
          sub: "Canonical Accounts Brain",
          icon: Building2,
          accent: "text-slate-600",
        },
        {
          id: "contacts",
          label: "Contacts",
          sub: "Decision Makers Directory",
          icon: Contact2,
          accent: "text-slate-600",
        },
        {
          id: "proposals",
          label: "Proposals",
          sub: "Scopes & Deposit Terms",
          icon: FileText,
          accent: "text-slate-600",
        },
        {
          id: "calendar",
          label: "Calendar",
          sub: "Commercial Activity & Deadlines",
          icon: Clock,
          accent: "text-slate-600",
        },
      ],
    },
    {
      category: "INTELLIGENCE",
      items: [
        {
          id: "research_centre",
          label: "Research",
          sub: "On-Demand Deep Dives",
          icon: Search,
          accent: "text-slate-600",
        },
        {
          id: "sources_schedules",
          label: "Sources (Search Engines)",
          sub: "Active Scanners & Schedules",
          icon: Radio,
          accent: "text-slate-600",
        },
        {
          id: "analytics",
          label: "Analytics",
          sub: "Commercial Velocity & Margins",
          icon: BarChart3,
          accent: "text-slate-600",
        },
        {
          id: "ai_costs",
          label: "AI Costs & Tiers",
          sub: "Model Spend & Research Tiers",
          icon: Coins,
          accent: "text-slate-600",
        },
        {
          id: "settings",
          label: "Settings",
          sub: "Studio Preferences & Rules",
          icon: SettingsIcon,
          accent: "text-slate-600",
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#e5e5eb] flex flex-col justify-between shrink-0 select-none overflow-hidden h-screen">
      {/* Studio Brand Header */}
      <div className="p-4 border-b border-[#e5e5eb] bg-[#fafafb] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#111116] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-sm">
            A/H
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-xs tracking-tight text-[#111116] truncate">
              ADRASTICHYPERLINK
            </div>
            <div className="text-[10px] text-[#6b6e7d] font-sans flex items-center justify-between mt-0.5">
              <span className="font-medium">Acquisition OS</span>
              {mode === "demo" ? (
                <span className="bg-amber-100 text-amber-800 font-mono text-[9px] px-1.5 py-0.2 rounded font-bold border border-amber-200">
                  DEMO
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 font-mono text-[9px] px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                  LIVE
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categorized Scrollable Nav Items */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider text-[#8e919f]">
              {sec.category}
            </div>

            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkspace === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectWorkspace(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 ${
                    isActive
                      ? "bg-[#111116] text-white font-semibold shadow-sm"
                      : "text-[#3e414c] hover:text-[#111116] hover:bg-[#f1f1f5]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? "text-white"
                          : item.accent || "text-[#6b6e7d]"
                      }`}
                    />
                    <div className="truncate">
                      <div className="text-xs font-medium tracking-tight">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? "text-[#a6a8b5]" : "text-[#7b7e8d]"
                        }`}
                      >
                        {item.sub}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-sans px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        item.badgeColor || "bg-[#e5e5eb] text-[#3e414c]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Director Identity Footer */}
      <div className="p-3 border-t border-[#e5e5eb] bg-[#fafafb] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#111116] text-white flex items-center justify-center text-[10px] font-bold">
              DS
            </div>
            <div>
              <div className="text-xs font-bold text-[#111116]">Daniel Shirley</div>
              <div className="text-[10px] text-[#6b6e7d]">Founder & Creative Director</div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
        </div>
      </div>
    </aside>
  );
}
