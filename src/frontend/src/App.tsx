import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Layout from "./components/Layout";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "./hooks/useQueries";
import Dashboard from "./pages/Dashboard";
import FeeStructure from "./pages/FeeStructure";
import OutstandingBalances from "./pages/OutstandingBalances";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Students from "./pages/Students";

type Page =
  | "dashboard"
  | "students"
  | "fee-structure"
  | "payments"
  | "outstanding"
  | "reports";

function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.22 0.055 252) 0%, oklch(0.28 0.07 260) 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 mx-auto mb-4">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            EduFeePro
          </h1>
          <p className="text-white/80 mt-1 text-sm font-medium">
            For Indian Schools
          </p>
          <p className="text-white/50 mt-1 text-xs">
            School Fee Management System
          </p>
        </div>
        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg">Welcome Back</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Sign in to manage school fees
            </p>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={isLoggingIn}
              data-ocid="login.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Signing
                  in...
                </>
              ) : (
                "Sign in with Internet Identity"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Secure, decentralized authentication
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileSetup({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      onComplete();
    } catch {
      toast.error("Failed to save profile.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.22 0.055 252) 0%, oklch(0.28 0.07 260) 100%)",
      }}
    >
      <Card className="w-full max-w-sm border-0 shadow-2xl">
        <CardHeader>
          <CardTitle>Set up your profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tell us your name to get started
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="profileName">Your Name</Label>
              <Input
                id="profileName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                required
                data-ocid="profile.name.input"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={saveProfile.isPending}
              data-ocid="profile.submit.submit_button"
            >
              {saveProfile.isPending && (
                <Loader2 size={14} className="mr-2 animate-spin" />
              )}
              Get Started
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [page, setPage] = useState<Page>("dashboard");
  const queryClient = useQueryClient();

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  if (showProfileSetup) {
    return (
      <>
        <ProfileSetup
          onComplete={() =>
            queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] })
          }
        />
        <Toaster />
      </>
    );
  }

  const userName = userProfile?.name ?? "Admin";

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard userName={userName} />;
      case "students":
        return <Students />;
      case "fee-structure":
        return <FeeStructure />;
      case "payments":
        return <Payments />;
      case "outstanding":
        return <OutstandingBalances />;
      case "reports":
        return <Reports />;
      default:
        return <Dashboard userName={userName} />;
    }
  };

  return (
    <>
      <Layout currentPage={page} onNavigate={setPage} userName={userName}>
        {renderPage()}
      </Layout>
      <Toaster />
    </>
  );
}
