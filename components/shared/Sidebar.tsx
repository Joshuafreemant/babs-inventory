"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PageKey } from "@/lib/types";
import { FaCartArrowDown, FaChartArea, FaChevronDown, FaChevronRight, FaStethoscope, FaUsers } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import { IoCloseSharp, IoLogOut } from "react-icons/io5";
import { LucidePackageCheck } from "lucide-react";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { CgOrganisation } from "react-icons/cg";
import { GoPackageDependencies } from "react-icons/go";
import { RiBriefcase2Fill, RiHospitalFill } from "react-icons/ri";
import { ImAddressBook } from "react-icons/im";
import { HiMenuAlt3 } from "react-icons/hi";
interface SidebarProps {
  currentPage: PageKey;
  onPageChange: (page: PageKey) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      business: true,
      contacts: true,
    },
  );

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleNavClick = (page: PageKey) => {
    onPageChange(page);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Clear the auth cookie
      document.cookie = "pharmt_token=; path=/; max-age=0; SameSite=Strict";
      // Clear localStorage fallback if used
      localStorage.removeItem("pharmt_token");
      // Redirect to login
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  };

  const isActive = (pageId: PageKey) => currentPage === pageId;

const NavButton = ({
  id,
  label,
  icon,
  isChild = false,
}: {
  id: PageKey;
  label: string;
  icon: any;
  isChild?: boolean;
}) => (
  <button
    onClick={() => handleNavClick(id)}
    className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all duration-200 ${
      isActive(id)
        ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    } ${isChild ? "pl-11" : ""}`}
  >
    {/* Check if icon is a string (Themify) or a component */}
    {typeof icon === 'string' ? (
      <i className={`ti ${icon} text-lg ${isActive(id) ? "text-blue-600" : "text-gray-500"}`}></i>
    ) : (
      <span className={`text-lg ${isActive(id) ? "text-blue-600" : "text-gray-500"}`}>
        {icon}
      </span>
    )}
    <span className="text-sm">{label}</span>
    {isActive(id) && (
      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
    )}
  </button>
);

  const GroupHeader = ({
  title,
  groupKey,
  icon,
}: {
  title: string;
  groupKey: string;
  icon: any;
}) => (
  <button
    onClick={() => toggleGroup(groupKey)}
    className="w-full text-left px-4 py-2 rounded-lg flex items-center justify-between text-gray-600 hover:bg-gray-50 transition-colors"
  >
    <div className="flex items-center gap-3">
      {typeof icon === 'string' ? (
        <i className={`ti ${icon} text-base text-gray-400`}></i>
      ) : (
        <span className="text-base text-gray-400">{icon}</span>
      )}
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </span>
    </div>
    {expandedGroups[groupKey] ? (
      <FaChevronDown className="text-sm text-gray-400 transition-transform duration-200" />
    ) : (
      <FaChevronRight className="text-sm text-gray-400 transition-transform duration-200" />
    )}
  </button>
);

  const Divider = () => <div className="h-px bg-gray-100 my-2 mx-4" />;

  const Logo = () => (
    <div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
        PharmTrack
      </h1>
      <p className="text-xs text-gray-400 mt-0.5 tracking-wide">
        Sales Manager
      </p>
    </div>
  );

  const LogoutButton = () => (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loggingOut ? 
  <FiLoader className="text-lg text-gray-400 group-hover:text-red-500 transition-colors animate-spin" /> : 
  <IoLogOut className="text-lg text-gray-400 group-hover:text-red-500 transition-colors" />
}
      <span className="text-sm font-medium">
        {loggingOut ? "Signing out…" : "Sign out"}
      </span>
    </button>
  );

  const NavContent = () => (
    <div className="space-y-0.5">
      <NavButton id="dashboard" label="Dashboard" icon={<MdOutlineDashboardCustomize />} />
      <NavButton id="inventory" label="Inventory" icon={<GoPackageDependencies />} />

      <Divider />

      <GroupHeader
        title="Company's Business"
        groupKey="business"
        icon={<CgOrganisation />}
      />
      {expandedGroups.business && (
        <div className="space-y-0.5 ml-2">
          <NavButton
            id="direct"
            label="Direct Sales"
            icon={<FaCartArrowDown />}
            isChild
          />
          <NavButton
            id="distributor"
            label="Distributor"
            icon={<FaUsers />}
            isChild
          />
          <NavButton
            id="institutional"
            label="Institutional"
            icon={<RiHospitalFill />}
            isChild
          />
        </div>
      )}

      <Divider />

      <NavButton id="personal" label="Personal" icon={<RiBriefcase2Fill  />} />

      <Divider />

      <GroupHeader
        title="Contacts & Insights"
        groupKey="contacts"
        icon={<ImAddressBook  />}
      />
      {expandedGroups.contacts && (
        <div className="space-y-0.5 ml-2">
          <NavButton
            id="doctors"
            label="Doctors"
            icon={<FaStethoscope />}
            isChild
          />
          <NavButton id="kpi" label="KPI" icon={<FaChartArea />} isChild />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile: Floating Hamburger Button ──────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className={`md:hidden fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all duration-150 ${
          mobileOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-label="Open menu"
      >
        <HiMenuAlt3  className="text-xl"/>
      </button>

      {/* ── Mobile: Backdrop ───────────────────────────────────────────── */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* ── Mobile: Slide-in Drawer ────────────────────────────────────── */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <Logo />
          <button
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            aria-label="Close menu"
          >
          <IoCloseSharp  className=" text-lg"/>
          </button>
        </div>

        {/* Drawer Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <NavContent />
        </nav>

        {/* Drawer Footer */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <LogoutButton />
          <p className="text-xs text-gray-400 text-center pt-1">
            PharmTrack v2.0
          </p>
        </div>
      </aside>

      {/* ── Desktop: Persistent Sidebar ───────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 shadow-sm">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-100">
          <Logo />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <NavContent />
        </nav>

        {/* Desktop Footer */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <LogoutButton />
          <p className="text-xs text-gray-400 text-center pt-1">
            PharmTrack v2.0
          </p>
        </div>
      </aside>
    </>
  );
}
