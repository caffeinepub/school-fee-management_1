import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ArrowLeft, Loader2, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Student } from "../backend";
import {
  useAllFeeAssignments,
  useGetAllFeeCategories,
  useGetAllStudents,
  useGetFeeAssignmentsByStudent,
  useGetPaymentsByStudent,
  useRegisterStudent,
} from "../hooks/useQueries";
import { INDIAN_CLASSES, formatINR } from "../utils/format";

function StudentProfile({
  studentId,
  student,
  onBack,
}: { studentId: number; student: Student; onBack: () => void }) {
  const { data: payments, isLoading: paymentsLoading } =
    useGetPaymentsByStudent(BigInt(studentId));
  const { data: assignments } = useGetFeeAssignmentsByStudent(
    BigInt(studentId),
  );
  const { data: categories } = useGetAllFeeCategories();

  const totalAssigned =
    assignments?.reduce((sum, a) => {
      const cat = categories?.[Number(a.feeCategoryId)];
      return sum + (cat?.amount ?? 0n);
    }, 0n) ?? 0n;
  const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0n) ?? 0n;
  const outstanding =
    totalAssigned - totalPaid < 0n ? 0n : totalAssigned - totalPaid;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          data-ocid="students.back.button"
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{student.name}</h1>
          <p className="text-sm text-muted-foreground">{student.grade}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Assigned
            </p>
            <p className="text-xl font-bold text-foreground mt-1">
              {formatINR(totalAssigned)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Paid
            </p>
            <p className="text-xl font-bold text-success mt-1">
              {formatINR(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Outstanding
            </p>
            <p className="text-xl font-bold text-destructive mt-1">
              {formatINR(outstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Student Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            {student.email}
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span>{" "}
            {student.phone}
          </div>
          <div>
            <span className="text-muted-foreground">Parent/Guardian:</span>{" "}
            {student.parentName}
          </div>
          <div>
            <span className="text-muted-foreground">Enrolled:</span>{" "}
            {new Date(
              Number(student.enrollmentDate) / 1_000_000,
            ).toLocaleDateString("en-IN")}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <Skeleton
              className="h-20 w-full"
              data-ocid="students.loading_state"
            />
          ) : payments?.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-4"
              data-ocid="students.empty_state"
            >
              No payments recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((p) => (
                  <TableRow
                    key={`${p.date}-${p.amount}`}
                    data-ocid="students.item.1"
                  >
                    <TableCell className="text-sm">
                      {new Date(Number(p.date) / 1_000_000).toLocaleDateString(
                        "en-IN",
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-success">
                      {formatINR(p.amount)}
                    </TableCell>
                    <TableCell className="text-sm">{p.paymentMethod}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.referenceNumber || "\u2014"}
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

export default function Students() {
  const { data: students, isLoading } = useGetAllStudents();
  const { data: categories } = useGetAllFeeCategories();
  const { data: allAssignments } = useAllFeeAssignments(students?.length ?? 0);
  const registerStudent = useRegisterStudent();
  const [open, setOpen] = useState(false);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState<number | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    grade: "",
    parentName: "",
    phone: "",
    email: "",
    enrollmentDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const enrollmentMs = form.enrollmentDate
        ? new Date(form.enrollmentDate).getTime()
        : Date.now();
      await registerStudent.mutateAsync({
        name: form.name,
        grade: form.grade,
        parentName: form.parentName,
        phone: form.phone,
        email: form.email,
        enrollmentDate: BigInt(enrollmentMs) * 1_000_000n,
      });
      toast.success("Student registered successfully!");
      setOpen(false);
      setForm({
        name: "",
        grade: "",
        parentName: "",
        phone: "",
        email: "",
        enrollmentDate: "",
      });
    } catch {
      toast.error("Failed to register student.");
    }
  };

  if (selectedStudentIdx !== null && students?.[selectedStudentIdx]) {
    return (
      <StudentProfile
        studentId={selectedStudentIdx}
        student={students[selectedStudentIdx]}
        onBack={() => setSelectedStudentIdx(null)}
      />
    );
  }

  const filtered =
    students?.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.grade.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage student registrations and profiles
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="students.add.primary_button">
              <UserPlus size={16} className="mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" data-ocid="students.dialog">
            <DialogHeader>
              <DialogTitle>Register New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Aarav Sharma"
                    required
                    data-ocid="students.name.input"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Class / Grade *</Label>
                  <Select
                    value={form.grade}
                    onValueChange={(v) => setForm((p) => ({ ...p, grade: v }))}
                    required
                  >
                    <SelectTrigger data-ocid="students.grade.select">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_CLASSES.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="parentName">Parent / Guardian Name</Label>
                  <Input
                    id="parentName"
                    value={form.parentName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, parentName: e.target.value }))
                    }
                    placeholder="e.g. Rajesh Sharma"
                    data-ocid="students.parentname.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+91 XXXXX XXXXX"
                    data-ocid="students.phone.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    data-ocid="students.email.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="enrollmentDate">Enrollment Date</Label>
                  <Input
                    id="enrollmentDate"
                    type="date"
                    value={form.enrollmentDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, enrollmentDate: e.target.value }))
                    }
                    data-ocid="students.enrollmentdate.input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  data-ocid="students.cancel.button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={registerStudent.isPending || !form.grade}
                  data-ocid="students.submit.submit_button"
                >
                  {registerStudent.isPending && (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  )}
                  Register
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          className="pl-9"
          placeholder="Search by name or class..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-ocid="students.search_input"
        />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3" data-ocid="students.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground text-sm"
              data-ocid="students.empty_state"
            >
              No students found. Add your first student!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Parent / Guardian</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Assigned</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s, idx) => {
                  const realIdx = students?.indexOf(s) ?? idx;
                  const studentAssignments =
                    allAssignments?.filter(
                      (a) => a.studentId === BigInt(realIdx),
                    ) ?? [];
                  const totalAssigned = studentAssignments.reduce((sum, a) => {
                    const catIdx = Number(a.feeCategoryId);
                    const cat = categories?.[catIdx];
                    return sum + (cat?.amount ?? 0n);
                  }, 0n);
                  return (
                    <TableRow
                      key={s.name}
                      data-ocid={`students.item.${idx + 1}`}
                      className="cursor-pointer"
                      onClick={() => setSelectedStudentIdx(realIdx)}
                    >
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.grade}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.parentName || "\u2014"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.phone || "\u2014"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatINR(totalAssigned)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success border-0 text-xs">
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
