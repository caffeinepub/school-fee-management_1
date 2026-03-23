import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAllPayments,
  useGetAllFeeCategories,
  useGetAllStudents,
  useRecordPayment,
} from "../hooks/useQueries";
import { FREQUENCY_LABELS, formatINR } from "../utils/format";

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "UPI", "Online"];

export default function Payments() {
  const { data: students } = useGetAllStudents();
  const { data: categories } = useGetAllFeeCategories();
  const studentCount = students?.length ?? 0;
  const { data: allPayments, isLoading: paymentsLoading } =
    useAllPayments(studentCount);
  const recordPayment = useRecordPayment();

  const [form, setForm] = useState({
    studentId: "",
    feeCategoryId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    referenceNumber: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateMs = new Date(form.date).getTime();
      await recordPayment.mutateAsync({
        studentId: BigInt(form.studentId),
        feeCategoryId: BigInt(form.feeCategoryId),
        // Backend stores whole rupees (no paise)
        amount: BigInt(Math.round(Number.parseFloat(form.amount))),
        date: BigInt(dateMs) * 1_000_000n,
        paymentMethod: form.paymentMethod,
        referenceNumber: form.referenceNumber,
        notes: form.notes,
      });
      toast.success("Payment recorded successfully!");
      setForm({
        studentId: "",
        feeCategoryId: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "Cash",
        referenceNumber: "",
        notes: "",
      });
    } catch {
      toast.error("Failed to record payment.");
    }
  };

  const sortedPayments = [...(allPayments ?? [])].sort((a, b) =>
    Number(b.date - a.date),
  );

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Record and track fee payments
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Form */}
        <Card className="xl:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Record New Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-3"
              data-ocid="payments.section"
            >
              <div className="space-y-1">
                <Label>Student *</Label>
                <Select
                  value={form.studentId}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, studentId: v }))
                  }
                >
                  <SelectTrigger data-ocid="payments.student.select">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((s, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: no stable ID
                      <SelectItem key={i} value={i.toString()}>
                        {s.name} \u2013 {s.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Fee Category *</Label>
                <Select
                  value={form.feeCategoryId}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, feeCategoryId: v }))
                  }
                >
                  <SelectTrigger data-ocid="payments.category.select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: no stable ID
                      <SelectItem key={i} value={i.toString()}>
                        {c.name} \u2014 {formatINR(c.amount)}/
                        {FREQUENCY_LABELS[c.frequency]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  min="0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  placeholder="e.g. 8000"
                  required
                  data-ocid="payments.amount.input"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="date">Payment Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  required
                  data-ocid="payments.date.input"
                />
              </div>
              <div className="space-y-1">
                <Label>Payment Method *</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, paymentMethod: v }))
                  }
                >
                  <SelectTrigger data-ocid="payments.method.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ref">Reference / Receipt No.</Label>
                <Input
                  id="ref"
                  value={form.referenceNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, referenceNumber: e.target.value }))
                  }
                  data-ocid="payments.reference.input"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={2}
                  data-ocid="payments.notes.textarea"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  recordPayment.isPending ||
                  !form.studentId ||
                  !form.feeCategoryId
                }
                data-ocid="payments.submit.submit_button"
              >
                {recordPayment.isPending ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Plus size={14} className="mr-2" />
                )}
                Record Payment
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="xl:col-span-3 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {paymentsLoading ? (
              <div className="p-4 space-y-3" data-ocid="payments.loading_state">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : sortedPayments.length === 0 ? (
              <div
                className="text-center py-12 text-muted-foreground text-sm"
                data-ocid="payments.empty_state"
              >
                No payments recorded yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.slice(0, 20).map((p, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: no stable ID
                    <TableRow key={i} data-ocid={`payments.item.${i + 1}`}>
                      <TableCell className="font-medium">
                        {students?.[Number(p.studentId)]?.name ??
                          `Student #${p.studentId}`}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success border-0">
                          {formatINR(p.amount)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.paymentMethod}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(
                          Number(p.date) / 1_000_000,
                        ).toLocaleDateString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
