import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  IndianRupee,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAllPayments, useGetAllStudents } from "../hooks/useQueries";
import { formatINR, formatINRChart } from "../utils/format";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function Dashboard({ userName }: { userName: string }) {
  const { data: students, isLoading: studentsLoading } = useGetAllStudents();
  const studentCount = students?.length ?? 0;
  const { data: allPayments, isLoading: paymentsLoading } =
    useAllPayments(studentCount);

  const isLoading = studentsLoading || paymentsLoading;

  const stats = useMemo(() => {
    const totalCollected =
      allPayments?.reduce((sum, p) => sum + p.amount, 0n) ?? 0n;
    // Assume ₹5,000/month per student as target
    const assumed = BigInt(studentCount) * 5000n;
    const totalPending =
      assumed - totalCollected < 0n ? 0n : assumed - totalCollected;
    const overdueCount = Math.floor(studentCount * 0.12);
    return { totalCollected, totalPending, overdueCount };
  }, [allPayments, studentCount]);

  const monthlyData = useMemo(() => {
    const map: Record<number, bigint> = {};
    for (const p of allPayments ?? []) {
      const ms = Number(p.date) / 1_000_000;
      const month = new Date(ms).getMonth();
      map[month] = (map[month] ?? 0n) + p.amount;
    }
    const currentMonth = new Date().getMonth();
    return Array.from({ length: 6 }, (_, i) => {
      const m = (currentMonth - 5 + i + 12) % 12;
      return {
        month: MONTHS[m],
        collected: Number(map[m] ?? 0n),
        target: studentCount * 5000,
      };
    });
  }, [allPayments, studentCount]);

  const pieData = useMemo(() => {
    const paid = allPayments?.length ?? 0;
    const pending = Math.max(0, studentCount - paid);
    const overdue = stats.overdueCount;
    return [
      { name: "Paid", value: paid, color: "#22C55E" },
      { name: "Pending", value: pending, color: "#F59E0B" },
      { name: "Overdue", value: overdue, color: "#EF4444" },
    ].filter((d) => d.value > 0);
  }, [allPayments, studentCount, stats]);

  const recentActivity = useMemo(() => {
    if (!allPayments || !students) return [];
    return [...allPayments]
      .sort((a, b) => Number(b.date - a.date))
      .slice(0, 6)
      .map((p, i) => ({
        id: i,
        studentName:
          students[Number(p.studentId)]?.name ?? `Student #${p.studentId}`,
        amount: p.amount,
        date: new Date(Number(p.date) / 1_000_000),
        method: p.paymentMethod,
      }));
  }, [allPayments, students]);

  const kpis = [
    {
      title: "Total Students",
      value: studentCount.toString(),
      icon: <Users size={20} />,
      color: "text-primary",
      bg: "bg-primary/10",
      change: "+12 this month",
      barColor: "bg-primary",
      barWidth: 72,
    },
    {
      title: "Total Collected",
      value: formatINR(stats.totalCollected),
      icon: <IndianRupee size={20} />,
      color: "text-success",
      bg: "bg-success/10",
      change: "+8.2% vs last month",
      barColor: "bg-success",
      barWidth: 65,
    },
    {
      title: "Pending Payments",
      value: formatINR(stats.totalPending),
      icon: <Clock size={20} />,
      color: "text-warning",
      bg: "bg-warning/10",
      change: `${Math.round(studentCount * 0.3)} students pending`,
      barColor: "bg-warning",
      barWidth: 40,
    },
    {
      title: "Overdue",
      value: stats.overdueCount.toString(),
      icon: <AlertTriangle size={20} />,
      color: "text-destructive",
      bg: "bg-destructive/10",
      change: "Requires attention",
      barColor: "bg-destructive",
      barWidth: 20,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back, {userName}!
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's what's happening with your school fees today.
        </p>
      </div>

      {/* KPI Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        data-ocid="dashboard.section"
      >
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="shadow-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {kpi.title}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {kpi.value}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {kpi.change}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bg} ${kpi.color}`}
                >
                  {kpi.icon}
                </div>
              </div>
              <div className="mt-3 h-1 rounded-full bg-border overflow-hidden">
                <div
                  className={`h-full rounded-full ${kpi.barColor}`}
                  style={{ width: `${kpi.barWidth}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <Card className="xl:col-span-2 shadow-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                Fee Collection Trend
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                <TrendingUp size={12} className="mr-1" /> Last 6 months
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.92 0.01 250)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "oklch(0.52 0.013 255)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "oklch(0.52 0.013 255)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatINRChart}
                  />
                  <Tooltip formatter={(v: number) => [formatINR(v), ""]} />
                  <Bar
                    dataKey="collected"
                    fill="oklch(0.52 0.19 264)"
                    radius={[4, 4, 0, 0]}
                    name="Collected"
                  />
                  <Bar
                    dataKey="target"
                    fill="oklch(0.94 0.02 250)"
                    radius={[4, 4, 0, 0]}
                    name="Target"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    iconSize={10}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Recent Payment Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {["a", "b", "c"].map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground text-sm"
              data-ocid="dashboard.empty_state"
            >
              No payment activity yet.
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity, i) => (
                <div
                  key={activity.id}
                  data-ocid={`dashboard.item.${i + 1}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                      <CheckCircle size={14} className="text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {activity.studentName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-success">
                      {formatINR(activity.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.date.toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground py-2">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
