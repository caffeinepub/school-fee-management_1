import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  useAllFeeAssignments,
  useAllPayments,
  useGetAllFeeCategories,
  useGetAllStudents,
} from "../hooks/useQueries";
import { formatINR } from "../utils/format";

export default function OutstandingBalances() {
  const { data: students, isLoading: studentsLoading } = useGetAllStudents();
  const { data: categories } = useGetAllFeeCategories();
  const studentCount = students?.length ?? 0;
  const { data: allPayments, isLoading: paymentsLoading } =
    useAllPayments(studentCount);
  const { data: allAssignments, isLoading: assignmentsLoading } =
    useAllFeeAssignments(studentCount);

  const isLoading = studentsLoading || paymentsLoading || assignmentsLoading;

  const rows = useMemo(() => {
    if (!students || !allPayments || !allAssignments || !categories) return [];
    return students.map((s, idx) => {
      const studentAssignments = allAssignments.filter(
        (a) => a.studentId === BigInt(idx),
      );
      const assigned = studentAssignments.reduce((sum, a) => {
        const cat = categories[Number(a.feeCategoryId)];
        return sum + (cat?.amount ?? 0n);
      }, 0n);
      const paid = allPayments
        .filter((p) => p.studentId === BigInt(idx))
        .reduce((sum, p) => sum + p.amount, 0n);
      const outstanding = assigned - paid < 0n ? 0n : assigned - paid;
      const paidPct =
        assigned > 0n
          ? Math.min(100, Math.round(Number((paid * 100n) / assigned)))
          : 0;
      return {
        idx,
        name: s.name,
        grade: s.grade,
        assigned,
        paid,
        outstanding,
        paidPct,
      };
    });
  }, [students, allPayments, allAssignments, categories]);

  const totals = useMemo(
    () => ({
      assigned: rows.reduce((s, r) => s + r.assigned, 0n),
      paid: rows.reduce((s, r) => s + r.paid, 0n),
      outstanding: rows.reduce((s, r) => s + r.outstanding, 0n),
    }),
    [rows],
  );

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Outstanding Balances</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track unpaid fee balances per student
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Assigned
            </p>
            {isLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-xl font-bold">{formatINR(totals.assigned)}</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Collected
            </p>
            {isLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-xl font-bold text-success">
                {formatINR(totals.paid)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Outstanding
            </p>
            {isLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-xl font-bold text-destructive">
                {formatINR(totals.outstanding)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="p-4 space-y-3"
              data-ocid="outstanding.loading_state"
            >
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground text-sm"
              data-ocid="outstanding.empty_state"
            >
              No student data available.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    key={row.idx}
                    data-ocid={`outstanding.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.grade}
                    </TableCell>
                    <TableCell>{formatINR(row.assigned)}</TableCell>
                    <TableCell className="text-success font-medium">
                      {formatINR(row.paid)}
                    </TableCell>
                    <TableCell
                      className={
                        row.outstanding > 0n
                          ? "text-destructive font-medium"
                          : "text-success font-medium"
                      }
                    >
                      {formatINR(row.outstanding)}
                    </TableCell>
                    <TableCell className="w-32">
                      <Progress value={row.paidPct} className="h-1.5" />
                    </TableCell>
                    <TableCell>
                      {row.outstanding === 0n ? (
                        <Badge className="bg-success/10 text-success border-0 text-xs">
                          Paid
                        </Badge>
                      ) : row.paidPct > 50 ? (
                        <Badge className="bg-warning/10 text-warning border-0 text-xs">
                          Partial
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/10 text-destructive border-0 text-xs">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
