import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useAllFeeAssignments,
  useAllPayments,
  useGetAllFeeCategories,
  useGetAllStudents,
} from "../hooks/useQueries";
import { FREQUENCY_LABELS, formatINR, formatINRChart } from "../utils/format";

export default function Reports() {
  const { data: students, isLoading: studentsLoading } = useGetAllStudents();
  const { data: categories, isLoading: categoriesLoading } =
    useGetAllFeeCategories();
  const studentCount = students?.length ?? 0;
  const { data: allPayments, isLoading: paymentsLoading } =
    useAllPayments(studentCount);
  const { data: allAssignments, isLoading: assignmentsLoading } =
    useAllFeeAssignments(studentCount);

  const isLoading =
    studentsLoading ||
    categoriesLoading ||
    paymentsLoading ||
    assignmentsLoading;

  const categoryRows = useMemo(() => {
    if (!categories || !allPayments || !allAssignments) return [];
    return categories.map((cat, ci) => {
      const catAssignments = allAssignments.filter(
        (a) => a.feeCategoryId === BigInt(ci),
      );
      const expected = BigInt(catAssignments.length) * cat.amount;
      const collected = allPayments
        .filter((p) => p.feeCategoryId === BigInt(ci))
        .reduce((sum, p) => sum + p.amount, 0n);
      const pending = expected - collected < 0n ? 0n : expected - collected;
      const collectedPct =
        expected > 0n
          ? Math.min(100, Math.round(Number((collected * 100n) / expected)))
          : 0;
      return {
        name: cat.name,
        frequency: cat.frequency,
        expected,
        collected,
        pending,
        collectedPct,
      };
    });
  }, [categories, allPayments, allAssignments]);

  const totals = useMemo(
    () => ({
      expected: categoryRows.reduce((s, r) => s + r.expected, 0n),
      collected: categoryRows.reduce((s, r) => s + r.collected, 0n),
      pending: categoryRows.reduce((s, r) => s + r.pending, 0n),
    }),
    [categoryRows],
  );

  const chartData = categoryRows.map((r) => ({
    name: r.name.length > 12 ? `${r.name.slice(0, 12)}\u2026` : r.name,
    collected: Number(r.collected),
    pending: Number(r.pending),
  }));

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Fee collection summary and analytics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Expected
            </p>
            {isLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <p className="text-xl font-bold">{formatINR(totals.expected)}</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Collected
            </p>
            {isLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <p className="text-xl font-bold text-success">
                {formatINR(totals.collected)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Pending
            </p>
            {isLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <p className="text-xl font-bold text-warning">
                {formatINR(totals.pending)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Collected vs Pending by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton
              className="h-52 w-full"
              data-ocid="reports.loading_state"
            />
          ) : chartData.length === 0 ? (
            <div
              className="text-center py-10 text-muted-foreground text-sm"
              data-ocid="reports.empty_state"
            >
              No data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.92 0.01 250)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "oklch(0.52 0.013 255)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.52 0.013 255)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatINRChart}
                />
                <Tooltip formatter={(v: number) => [formatINR(v), ""]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="collected"
                  fill="oklch(0.72 0.19 145)"
                  radius={[4, 4, 0, 0]}
                  name="Collected"
                />
                <Bar
                  dataKey="pending"
                  fill="oklch(0.77 0.16 72)"
                  radius={[4, 4, 0, 0]}
                  name="Pending"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Fee Category Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : categoryRows.length === 0 ? (
            <div
              className="text-center py-10 text-muted-foreground text-sm"
              data-ocid="reports.empty_state"
            >
              No categories found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Collection Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryRows.map((row, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: no stable ID
                  <TableRow key={i} data-ocid={`reports.item.${i + 1}`}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {FREQUENCY_LABELS[row.frequency] ?? row.frequency}
                    </TableCell>
                    <TableCell>{formatINR(row.expected)}</TableCell>
                    <TableCell className="text-success font-medium">
                      {formatINR(row.collected)}
                    </TableCell>
                    <TableCell className="text-warning font-medium">
                      {formatINR(row.pending)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.collectedPct}%
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow
                  className="bg-muted/50 font-semibold"
                  data-ocid="reports.row"
                >
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell>{formatINR(totals.expected)}</TableCell>
                  <TableCell className="text-success">
                    {formatINR(totals.collected)}
                  </TableCell>
                  <TableCell className="text-warning">
                    {formatINR(totals.pending)}
                  </TableCell>
                  <TableCell>
                    {totals.expected > 0n
                      ? `${Math.min(100, Math.round(Number((totals.collected * 100n) / totals.expected)))}%`
                      : "0%"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
