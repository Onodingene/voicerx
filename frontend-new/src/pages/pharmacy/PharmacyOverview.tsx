"use client";

import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { type RootState } from "../../store";
import { Clock, CheckCircle2, AlertCircle, Calendar, Loader2 } from "lucide-react";
import PrescriptionTable from "../../components/PrescriptionTable";

export default function PharmacyDashboard() {
  const { token } = useSelector((state: RootState) => state.auth);

  // Fetch stats with auth token
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["prescription-stats"],
    queryFn: async () => {
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/prescriptions/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch statistics");
      }

      return response.json();
    },
    enabled: !!token,
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-hidden">
      {/* Header & Stats Section */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sm:py-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          Pharmacy Overview
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Pending"
            value={stats?.pending}
            color="yellow"
            Icon={Clock}
            loading={statsLoading}
          />
          <StatCard
            title="Dispensed"
            value={stats?.dispensed}
            color="green"
            Icon={CheckCircle2}
            loading={statsLoading}
          />
          <StatCard
            title="High Priority"
            value={stats?.highPriority}
            color="red"
            Icon={AlertCircle}
            loading={statsLoading}
          />
          <StatCard
            title="Today"
            value={stats?.dispensedToday}
            color="blue"
            Icon={Calendar}
            loading={statsLoading}
          />
        </div>
      </div>

      {/* The Reusable Table Component set to "all" */}
      <div className="flex-1 overflow-auto">
        <PrescriptionTable statusFilter="all" title="All Prescriptions" />
      </div>
    </div>
  );
}

// Simple internal helper for the stat cards
interface StatCardProps {
  title: string;
  value?: number;
  color: "yellow" | "green" | "red" | "blue";
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  loading?: boolean;
}

function StatCard({ title, value, color, Icon, loading }: StatCardProps) {
  const colors = {
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
    green: "bg-green-50 border-green-200 text-green-800",
    red: "bg-red-50 border-red-200 text-red-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-3 sm:p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium opacity-80">{title}</p>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-1" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold">{value ?? 0}</p>
          )}
        </div>
        <Icon size={28} className="opacity-50 hidden sm:block" />
      </div>
    </div>
  );
}
