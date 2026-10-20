"use client";

import React, { useState, useMemo } from "react";
import {
  Mail,
  Copy,
  Check,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Search,
  Users,
  Sparkles,
  Phone,
  Calendar,
  ShoppingBag,
  Info,
  X,
} from "lucide-react";
import { Order, ManualContact, CustomerContact } from "@/lib/types";

interface ContactsTabProps {
  orders: Order[];
  manualContacts: ManualContact[];
  onAddManualContact: (contact: {
    name: string;
    email: string;
    phone?: string;
    note?: string;
  }) => Promise<void>;
  onDeleteManualContact: (id: string) => Promise<void>;
}

export function ContactsTab({
  orders,
  manualContacts,
  onAddManualContact,
  onDeleteManualContact,
}: ContactsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<"all" | "order" | "manual">("all");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSelected, setCopiedSelected] = useState(false);
  const [copiedSingleEmail, setCopiedSingleEmail] = useState<string | null>(null);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newNote, setNewNote] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  // 1. Aggregate unique customers from orders + manual contacts
  const aggregatedContacts: CustomerContact[] = useMemo(() => {
    const map = new Map<string, CustomerContact>();

    // Process orders
    for (const order of orders) {
      if (!order.customer || !order.customer.email) continue;
      const rawEmail = order.customer.email.trim();
      const emailLower = rawEmail.toLowerCase();
      if (!emailLower || !emailLower.includes("@")) continue;

      const existing = map.get(emailLower);
      const orderDate = order.pickupDate || order.createdAt || "";
      const orderPrice = typeof order.totalPrice === "number" ? order.totalPrice : 0;

      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += orderPrice;
        if (orderDate > existing.lastOrderDate) {
          existing.lastOrderDate = orderDate;
          if (order.customer.name) existing.name = order.customer.name;
          if (order.customer.phone) existing.phone = order.customer.phone;
        }
      } else {
        map.set(emailLower, {
          id: `order-${emailLower}`,
          name: order.customer.name || "Zákazník",
          email: rawEmail,
          phone: order.customer.phone || "",
          ordersCount: 1,
          totalSpent: orderPrice,
          lastOrderDate: orderDate,
          source: "objednavka",
          notes: order.customer.notes || "",
        });
      }
    }

    // Process manual contacts
    for (const mc of manualContacts) {
      const emailLower = mc.email.trim().toLowerCase();
      if (!emailLower || !emailLower.includes("@")) continue;

      const existing = map.get(emailLower);
      if (existing) {
        if (mc.note) {
          existing.notes = existing.notes
            ? `${existing.notes} | ${mc.note}`
            : mc.note;
        }
      } else {
        map.set(emailLower, {
          id: mc.id,
          name: mc.name || "Kontakt",
          email: mc.email,
          phone: mc.phone || "",
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: mc.createdAt ? mc.createdAt.substring(0, 10) : "",
          source: "manual",
          notes: mc.note || "",
        });
      }
    }

    // Convert to sorted list (most recent first, then by orders count)
    return Array.from(map.values()).sort((a, b) => {
      if (b.ordersCount !== a.ordersCount) {
        return b.ordersCount - a.ordersCount;
      }
      return (b.lastOrderDate || "").localeCompare(a.lastOrderDate || "");
    });
  }, [orders, manualContacts]);

  // 2. Filter contacts based on search query & source filter
  const filteredContacts = useMemo(() => {
    return aggregatedContacts.filter((c) => {
      if (filterSource === "order" && c.source !== "objednavka") return false;
      if (filterSource === "manual" && c.source !== "manual") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    });
  }, [aggregatedContacts, filterSource, searchQuery]);

  // Statistics
  const totalCount = aggregatedContacts.length;
  const orderCustomersCount = aggregatedContacts.filter((c) => c.source === "objednavka").length;
  const manualCount = aggregatedContacts.filter((c) => c.source === "manual").length;
  const totalRevenue = aggregatedContacts.reduce((sum, c) => sum + c.totalSpent, 0);

  // Copy helper
  const handleCopyText = async (text: string, type: "all" | "selected" | "single", emailKey?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "all") {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2500);
      } else if (type === "selected") {
        setCopiedSelected(true);
        setTimeout(() => setCopiedSelected(false), 2500);
      } else if (type === "single" && emailKey) {
        setCopiedSingleEmail(emailKey);
        setTimeout(() => setCopiedSingleEmail(null), 2000);
      }
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);

      if (type === "all") {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2500);
      } else if (type === "selected") {
        setCopiedSelected(true);
        setTimeout(() => setCopiedSelected(false), 2500);
      }
    }
  };

  // Copy all visible/filtered emails
  const handleCopyAllEmails = () => {
    const list = filteredContacts.map((c) => c.email.trim()).filter(Boolean);
    if (list.length === 0) return;
    const str = list.join(", ");
    void handleCopyText(str, "all");
  };

  // Copy selected emails
  const handleCopySelectedEmails = () => {
    const list = Array.from(selectedEmails);
    if (list.length === 0) return;
    const str = list.join(", ");
    void handleCopyText(str, "selected");
  };

  // Open Gmail with Bcc
  const handleOpenGmail = (emails: string[]) => {
    if (emails.length === 0) return;
    const bccParam = encodeURIComponent(emails.join(", "));
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${bccParam}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  // Export CSV with UTF-8 BOM for Microsoft Excel compatibility
  const handleExportCSV = () => {
    if (aggregatedContacts.length === 0) return;
    const headers = ["Meno a priezvisko", "E-mail", "Telefón", "Počet objednávok", "Celková útrata (€)", "Posledná objednávka", "Zdroj", "Poznámka"];
    const rows = aggregatedContacts.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${c.phone.replace(/"/g, '""')}"`,
      c.ordersCount,
      c.totalSpent.toFixed(2),
      c.lastOrderDate,
      c.source === "objednavka" ? "Objednávka z webu" : "Manuálny kontakt",
      `"${(c.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kontakty-hanela-${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Selection toggle
  const toggleSelectEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEmails.size === filteredContacts.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredContacts.map((c) => c.email)));
    }
  };

  // Submit manual contact
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const emailTrimmed = newEmail.trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes("@") || !emailTrimmed.includes(".")) {
      setModalError("Zadajte platnú e-mailovú adresu.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddManualContact({
        name: newName.trim() || "Nový kontakt",
        email: emailTrimmed,
        phone: newPhone.trim(),
        note: newNote.trim(),
      });
      setIsAddModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewNote("");
    } catch {
      setModalError("Nepodarilo sa uložiť kontakt. Skúste to znova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero summary card */}
      <div className="bg-[#FFFFFF] border border-[#EAE5DC] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#FAF1F8] text-[#a62891] border border-[#ECD9E8]">
                <Mail className="w-5 h-5" />
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#261B24]">
                Databáza kontaktov a e-mailov
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#6B5B65] max-w-2xl">
              Automaticky zbiera všetky e-maily zákazníkov z objednávok na jednom mieste.
              Využite ich na sezónne ponuky, vianočné pečenie alebo novinky cez Gmail na 1 kliknutie.
            </p>
          </div>

          {/* Primary Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyAllEmails}
              disabled={filteredContacts.length === 0}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer ${
                copiedAll
                  ? "bg-[#345139] text-white border border-[#345139]"
                  : "bg-[#261B24] text-[#FAF8F5] hover:bg-[#3d2c3a] border border-[#261B24]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Skopíruje všetky e-maily oddelené čiarkou na vloženie do Bcc (Skrytá kópia)"
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Skopírované ({filteredContacts.length})!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#DFD8CD]" />
                  <span>Kopírovať všetky e-maily</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleOpenGmail(filteredContacts.map((c) => c.email))}
              disabled={filteredContacts.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-[#FFFFFF] text-[#261B24] border border-[#DFD8CD] hover:border-[#a62891] hover:text-[#a62891] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Otvorí novú správu v Gmaile so všetkými adresami v Bcc (skrytá kópia)"
            >
              <ExternalLink className="w-4 h-4 text-[#a62891]" />
              <span className="hidden sm:inline">Otvoriť v Gmaile</span>
              <span className="sm:hidden">Gmail</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={aggregatedContacts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-[#FFFFFF] text-[#6B5B65] border border-[#DFD8CD] hover:text-[#261B24] hover:border-[#261B24] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Stiahnuť tabuľku pre Microsoft Excel"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-[#FAF1F8] text-[#a62891] border border-[#ECD9E8] hover:bg-[#F4E4F1] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Pridať kontakt</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-[#EAE5DC]">
          <div className="p-3 sm:p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#9E8E98] block">
              Všetky kontakty
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-semibold text-[#261B24]">
                {totalCount}
              </span>
              <span className="text-xs text-[#6B5B65]">adries</span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#9E8E98] block">
              Z objednávok
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-semibold text-[#261B24]">
                {orderCustomersCount}
              </span>
              <span className="text-xs text-[#6B5B65]">zákazníkov</span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#9E8E98] block">
              Manuálne pridané
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-semibold text-[#261B24]">
                {manualCount}
              </span>
              <span className="text-xs text-[#6B5B65]">kontaktov</span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#9E8E98] block">
              Celkový obrat
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-semibold text-[#261B24]">
                {totalRevenue.toFixed(0)} €
              </span>
              <span className="text-xs text-[#6B5B65]">z objednávok</span>
            </div>
          </div>
        </div>
      </div>

      {/* Helpful Tip Box on how to send campaigns safely via Gmail (GDPR & Bcc) */}
      <div className="p-4 rounded-xl bg-[#FAF1F8]/60 border border-[#ECD9E8] text-[#261B24] flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[#a62891] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <p className="font-semibold text-[#a62891]">
            Ako jednoducho poslať hromadný e-mail majiteľky cez Gmail:
          </p>
          <p className="text-[#6B5B65] leading-relaxed">
            Kliknite na <strong>„Kopírovať všetky e-maily“</strong> a v Gmaile ich vložte do poľa <strong>Skrytá kópia (Bcc)</strong>.
            Zákazníci tak navzájom neuvidia svoje adresy, čo spĺňa nariadenie GDPR a pre zákazníka e-mail pôsobí príjemne a osobne.
          </p>
        </div>
      </div>

      {/* Search, Filter Tabs & Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8E98]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hľadať podľa mena, e-mailu alebo telefónu..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-[#FFFFFF] border border-[#DFD8CD] focus:outline-none focus:border-[#a62891] text-[#261B24] placeholder-[#9E8E98] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9E8E98] hover:text-[#261B24]"
            >
              ×
            </button>
          )}
        </div>

        {/* Source Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#FFFFFF] p-1 rounded-xl border border-[#DFD8CD]">
          <button
            type="button"
            onClick={() => setFilterSource("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterSource === "all"
                ? "bg-[#261B24] text-[#FAF8F5] shadow-xs"
                : "text-[#6B5B65] hover:text-[#261B24]"
            }`}
          >
            Všetky ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterSource("order")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterSource === "order"
                ? "bg-[#261B24] text-[#FAF8F5] shadow-xs"
                : "text-[#6B5B65] hover:text-[#261B24]"
            }`}
          >
            Z objednávok ({orderCustomersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterSource("manual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterSource === "manual"
                ? "bg-[#261B24] text-[#FAF8F5] shadow-xs"
                : "text-[#6B5B65] hover:text-[#261B24]"
            }`}
          >
            Manuálne ({manualCount})
          </button>
        </div>
      </div>

      {/* Multi-Select Floating / Sticky Action Bar (visible when items selected) */}
      {selectedEmails.size > 0 && (
        <div className="p-3.5 rounded-xl bg-[#261B24] text-[#FAF8F5] flex flex-wrap items-center justify-between gap-3 shadow-md transition-all animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#a62891] animate-pulse" />
            <span className="text-xs sm:text-sm font-medium">
              Označené: <strong>{selectedEmails.size}</strong> z {filteredContacts.length} kontaktov
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySelectedEmails}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFFFFF] text-[#261B24] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              {copiedSelected ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Skopírované!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopírovať označené ({selectedEmails.size})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleOpenGmail(Array.from(selectedEmails))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FAF1F8] text-[#a62891] hover:bg-[#F4E4F1] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Gmail Bcc</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEmails(new Set())}
              className="text-xs text-[#DFD8CD] hover:text-white px-2 py-1 transition-colors"
            >
              Zrušiť výber
            </button>
          </div>
        </div>
      )}

      {/* Contacts Table & List Card */}
      <div className="bg-[#FFFFFF] border border-[#EAE5DC] rounded-2xl shadow-xs overflow-hidden">
        {filteredContacts.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <Users className="w-10 h-10 text-[#DFD8CD] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#261B24]">
              {searchQuery ? "Nenašli sa žiadne kontakty zodpovedajúce filtru" : "Zatiaľ nie sú v systéme žiadne kontakty"}
            </p>
            <p className="text-xs text-[#6B5B65] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "Skúste upraviť hľadaný výraz alebo resetovať filter."
                : "Kontakty sa automaticky uložia pri každej novej rezervácii z webu, alebo ich môžete pridať manuálne."}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#261B24] text-[#FAF8F5] hover:bg-[#3d2c3a] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Pridať prvý kontakt</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EAE5DC] text-[11px] font-semibold text-[#6B5B65] uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedEmails.size === filteredContacts.length && filteredContacts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-[#DFD8CD] text-[#a62891] focus:ring-[#a62891] cursor-pointer"
                      title="Označiť všetkých"
                    />
                  </th>
                  <th className="py-3 px-4">Zákazník</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4">Telefón</th>
                  <th className="py-3 px-4 text-center">Objednávky</th>
                  <th className="py-3 px-4">Posledná aktivita</th>
                  <th className="py-3 px-4">Zdroj</th>
                  <th className="py-3 px-4 text-right">Akcie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DC] text-xs sm:text-sm">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedEmails.has(contact.email);
                  const isCopied = copiedSingleEmail === contact.email;
                  const initial = contact.name ? contact.name.trim()[0].toUpperCase() : "Z";

                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-[#FAF8F5]/80 transition-colors ${
                        isSelected ? "bg-[#FAF1F8]/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectEmail(contact.email)}
                          className="rounded border-[#DFD8CD] text-[#a62891] focus:ring-[#a62891] cursor-pointer"
                        />
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4 font-medium text-[#261B24]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#FAF1F8] border border-[#ECD9E8] text-[#a62891] flex items-center justify-center text-xs font-bold shrink-0">
                            {initial}
                          </div>
                          <div>
                            <span className="font-semibold block">{contact.name}</span>
                            {contact.notes && (
                              <span className="text-[11px] text-[#9E8E98] line-clamp-1 max-w-[200px]" title={contact.notes}>
                                {contact.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-[#261B24] hover:text-[#a62891] transition-colors font-mono text-xs"
                          >
                            {contact.email}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyText(contact.email, "single", contact.email)}
                            className="p-1 text-[#9E8E98] hover:text-[#261B24] hover:bg-[#FAF8F5] rounded transition-colors cursor-pointer"
                            title="Kopírovať e-mail"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-[#6B5B65]">
                        {contact.phone ? (
                          <a
                            href={`tel:${contact.phone}`}
                            className="hover:text-[#261B24] transition-colors inline-flex items-center gap-1 font-mono text-xs"
                          >
                            <Phone className="w-3 h-3 text-[#9E8E98]" />
                            <span>{contact.phone}</span>
                          </a>
                        ) : (
                          <span className="text-[#9E8E98] text-xs">—</span>
                        )}
                      </td>

                      {/* Orders Count & Total */}
                      <td className="py-3.5 px-4 text-center">
                        {contact.ordersCount > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF1F8] text-[#a62891] border border-[#ECD9E8]">
                              <ShoppingBag className="w-3 h-3" />
                              <span>{contact.ordersCount}x</span>
                            </span>
                            {contact.totalSpent > 0 && (
                              <span className="text-[11px] font-medium text-[#6B5B65] mt-0.5">
                                {contact.totalSpent.toFixed(0)} €
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#9E8E98]">0</span>
                        )}
                      </td>

                      {/* Last Activity Date */}
                      <td className="py-3.5 px-4 text-[#6B5B65] whitespace-nowrap text-xs">
                        {contact.lastOrderDate ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#9E8E98]" />
                            <span>{contact.lastOrderDate}</span>
                          </span>
                        ) : (
                          <span className="text-[#9E8E98]">—</span>
                        )}
                      </td>

                      {/* Source Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {contact.source === "objednavka" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F3F6F3] text-[#345139] border border-[#DCE4DC]">
                            Objednávka
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F8F4EE] text-[#6E5335] border border-[#EADFCF]">
                            Manuálny
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenGmail([contact.email])}
                            className="p-1.5 text-[#6B5B65] hover:text-[#a62891] hover:bg-[#FAF1F8] rounded-lg transition-colors cursor-pointer"
                            title="Napísať e-mail v Gmaile"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {contact.source === "manual" && (
                            <button
                              type="button"
                              onClick={() => onDeleteManualContact(contact.id)}
                              className="p-1.5 text-[#6B5B65] hover:text-rose-600 hover:bg-[#FBF2F2] rounded-lg transition-colors cursor-pointer"
                              title="Zmazať kontakt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Manual Contact */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FFFFFF] border border-[#EAE5DC] rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-scaleUp">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[#9E8E98] hover:text-[#261B24] hover:bg-[#FAF8F5] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <span className="p-2 rounded-xl bg-[#FAF1F8] text-[#a62891] border border-[#ECD9E8]">
                <Plus className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#261B24]">
                  Pridať nový kontakt
                </h3>
                <p className="text-xs text-[#6B5B65]">
                  Uložte kontakt z telefónu, Instagramu alebo osobného odberu.
                </p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-[#FBF2F2] border border-[#EDD5D5] text-rose-700 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#261B24] mb-1">
                  Meno a priezvisko
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="napr. Mária Kováčová"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD8CD] focus:outline-none focus:border-[#a62891] text-[#261B24]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#261B24] mb-1">
                  E-mailová adresa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="napr. maria@priklad.sk"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD8CD] focus:outline-none focus:border-[#a62891] text-[#261B24]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#261B24] mb-1">
                  Telefónne číslo (voliteľné)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="napr. +421 910 123 456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD8CD] focus:outline-none focus:border-[#a62891] text-[#261B24]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#261B24] mb-1">
                  Poznámka (voliteľné)
                </label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="napr. Záujem o vianočné pečivo / Instagram"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD8CD] focus:outline-none focus:border-[#a62891] text-[#261B24]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE5DC]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[#6B5B65] hover:text-[#261B24] transition-colors"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#261B24] text-[#FAF8F5] hover:bg-[#3d2c3a] transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Ukladám..." : "Uložiť kontakt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
