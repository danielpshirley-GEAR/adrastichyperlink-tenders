"use client";

import React, { useState } from "react";
import { Contact } from "@/lib/types";
import { Contact2, Search, Mail, Linkedin, ExternalLink } from "lucide-react";

interface ContactsWorkspaceProps {
  contacts: Contact[];
}

export function ContactsWorkspace({ contacts }: ContactsWorkspaceProps) {
  const [query, setQuery] = useState("");

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.jobTitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-slate-700 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Contact2 className="w-3.5 h-3.5" />
            SHARED BRAIN • CANONICAL CONTACTS DIRECTORY (SECTION 3)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Contacts & Decision Makers
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Verified buyers, department heads, and influencers across all customer acquisition engines.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Every lead connects back to a single human decision maker.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e919f]" />
          <input
            type="text"
            placeholder="Search contacts, titles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-[#e5e5eb] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#111116] placeholder-[#8e919f] focus:outline-none focus:border-[#111116] shadow-xs"
          />
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white border border-[#e5e5eb] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e5e5eb] bg-[#fafafb] text-[10px] font-sans uppercase font-bold text-[#8e919f]">
                <th className="py-3 px-5">Contact Name</th>
                <th className="py-3 px-4">Job Title</th>
                <th className="py-3 px-4">Role Category</th>
                <th className="py-3 px-4">Influence</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-5 text-right">Connect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f1f5]">
              {filtered.map((contact) => (
                <tr key={contact.id} className="hover:bg-[#fcfcfd] transition-colors">
                  <td className="py-3.5 px-5 font-bold text-[#111116]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#111116] text-white flex items-center justify-center font-bold text-[10px]">
                        {contact.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div>{contact.name}</div>
                        <div className="text-[10px] text-[#8e919f]">{contact.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#2b2b34] font-medium">{contact.jobTitle}</td>
                  <td className="py-3.5 px-4 text-[#6b6e7d] capitalize">
                    {contact.roleCategory.replace("_", " ")}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                      {contact.estimatedDecisionInfluence}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-sans font-semibold text-emerald-700">
                      ✓ Verified
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {contact.linkedinUrl && (
                        <a
                          href={contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[#8e919f] hover:text-blue-600 rounded-lg hover:bg-[#f1f1f5]"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="p-1.5 text-[#8e919f] hover:text-[#111116] rounded-lg hover:bg-[#f1f1f5]"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
