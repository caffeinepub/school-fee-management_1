import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  Bell,
  ChevronDown,
  CreditCard,
  GraduationCap,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type Page =
  | "dashboard"
  | "students"
  | "fee-structure"
  | "payments"
  | "outstanding"
  | "reports";

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  userName: string;
  children: React.ReactNode;
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "students", label: "Students", icon: <Users size={18} /> },
  {
    id: "fee-structure",
    label: "Fee Structure",
    icon: <IndianRupee size={18} />,
  },
  { id: "payments", label: "Payments", icon: <CreditCard size={18} /> },
  { id: "outstanding", label: "Outstanding", icon: <AlertCircle size={18} /> },
  { id: "reports", label: "Reports", icon: <BarChart3 size={18} /> },
];

export default function Layout({
  currentPage,
  onNavigate,
  userName,
  children,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span
              className="text-sm tracking-tight text-foreground leading-tight"
              style={{ fontWeight: 700 }}
            >
              EduFeePro
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              For Indian Schools
            </span>
          </div>
          <button
            type="button"
            className="ml-auto lg:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" data-ocid="nav.panel">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={`nav.${item.id}.link`}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium mb-0.5 transition-colors ${
                  isActive
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <span
                  className={
                    isActive ? "text-primary" : "text-muted-foreground"
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Settings bottom */}
        <div className="border-t border-sidebar-border px-3 py-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex h-16 items-center gap-4 px-5 border-b border-border"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.22 0.055 252), oklch(0.28 0.06 252))",
          }}
        >
          <button
            type="button"
            className="text-white lg:hidden"
            onClick={() => setSidebarOpen(true)}
            data-ocid="nav.menu.button"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          <button
            type="button"
            className="text-white/70 hover:text-white transition-colors"
            data-ocid="nav.notifications.button"
          >
            <Bell size={20} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-white hover:bg-white/10 transition-colors"
                data-ocid="nav.user.dropdown"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-white text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-medium leading-none">
                    {userName}
                  </div>
                  <div className="text-[10px] text-white/60 mt-0.5">Admin</div>
                </div>
                <ChevronDown size={14} className="text-white/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={handleLogout}
                data-ocid="nav.logout.button"
              >
                <LogOut size={14} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
