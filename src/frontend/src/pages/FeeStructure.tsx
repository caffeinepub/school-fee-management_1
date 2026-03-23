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
import { IndianRupee, Loader2, Plus, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Frequency } from "../backend";
import {
  useCreateFeeCategory,
  useGetAllFeeCategories,
} from "../hooks/useQueries";
import { FREQUENCY_LABELS, formatINR } from "../utils/format";

const frequencyColors: Record<string, string> = {
  annual: "bg-primary/10 text-primary",
  termly: "bg-warning/10 text-warning",
  monthly: "bg-success/10 text-success",
};

const INDIAN_FEE_PRESETS = [
  { name: "Tuition Fee", amount: 8000, frequency: Frequency.monthly },
  { name: "Exam Fee", amount: 2500, frequency: Frequency.termly },
  { name: "Sports Fee", amount: 1500, frequency: Frequency.termly },
  { name: "Computer Fee", amount: 1200, frequency: Frequency.monthly },
  { name: "Transport Fee", amount: 3500, frequency: Frequency.monthly },
  { name: "Library Fee", amount: 500, frequency: Frequency.termly },
  { name: "Activity Fee", amount: 800, frequency: Frequency.termly },
  { name: "Development Fee", amount: 5000, frequency: Frequency.annual },
];

export default function FeeStructure() {
  const { data: categories, isLoading } = useGetAllFeeCategories();
  const createCategory = useCreateFeeCategory();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: Frequency.annual,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = Math.round(Number.parseFloat(form.amount));
      await createCategory.mutateAsync({
        name: form.name,
        amount: BigInt(amount),
        frequency: form.frequency,
      });
      toast.success("Fee category created!");
      setOpen(false);
      setForm({ name: "", amount: "", frequency: Frequency.annual });
    } catch {
      toast.error("Failed to create fee category.");
    }
  };

  const applyPreset = (preset: (typeof INDIAN_FEE_PRESETS)[0]) => {
    setForm({
      name: preset.name,
      amount: preset.amount.toString(),
      frequency: preset.frequency,
    });
  };

  const totalAnnual =
    categories?.reduce((sum, c) => {
      const multiplier =
        c.frequency === Frequency.monthly
          ? 12n
          : c.frequency === Frequency.termly
            ? 3n
            : 1n;
      return sum + c.amount * multiplier;
    }, 0n) ?? 0n;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fee Structure</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure fee categories and amounts
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="fees.add.primary_button">
              <Plus size={16} className="mr-2" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" data-ocid="fees.dialog">
            <DialogHeader>
              <DialogTitle>New Fee Category</DialogTitle>
            </DialogHeader>

            {/* Indian Presets */}
            <div className="mt-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap size={13} className="text-warning" />
                <span className="text-xs font-medium text-muted-foreground">
                  Quick-add Indian school presets
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {INDIAN_FEE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="text-left rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary transition-colors"
                    data-ocid="fees.preset.button"
                  >
                    <span className="font-medium text-foreground block">
                      {preset.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatINR(preset.amount)}/
                      {FREQUENCY_LABELS[preset.frequency]?.toLowerCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="catName">Category Name *</Label>
                  <Input
                    id="catName"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Tuition Fee"
                    required
                    data-ocid="fees.name.input"
                  />
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
                    data-ocid="fees.amount.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Frequency *</Label>
                  <Select
                    value={form.frequency}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, frequency: v as Frequency }))
                    }
                  >
                    <SelectTrigger data-ocid="fees.frequency.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Frequency.annual}>Annual</SelectItem>
                      <SelectItem value={Frequency.termly}>
                        Term-wise
                      </SelectItem>
                      <SelectItem value={Frequency.monthly}>Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    data-ocid="fees.cancel.button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCategory.isPending}
                    data-ocid="fees.submit.submit_button"
                  >
                    {createCategory.isPending && (
                      <Loader2 size={14} className="mr-2 animate-spin" />
                    )}
                    Create
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <IndianRupee size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Categories</p>
              <p className="text-xl font-bold">{categories?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card sm:col-span-2">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Est. Annual Fee Per Student
            </p>
            <p className="text-xl font-bold">{formatINR(totalAnnual)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3" data-ocid="fees.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !categories?.length ? (
            <div
              className="text-center py-12 text-muted-foreground text-sm"
              data-ocid="fees.empty_state"
            >
              No fee categories yet. Create your first one!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Annual Equiv.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat, i) => {
                  const multiplier =
                    cat.frequency === Frequency.monthly
                      ? 12n
                      : cat.frequency === Frequency.termly
                        ? 3n
                        : 1n;
                  const annual = cat.amount * multiplier;
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: no stable ID
                    <TableRow key={i} data-ocid={`fees.item.${i + 1}`}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>{formatINR(cat.amount)}</TableCell>
                      <TableCell>
                        <Badge
                          className={`${frequencyColors[cat.frequency] ?? ""} border-0 text-xs`}
                        >
                          {FREQUENCY_LABELS[cat.frequency] ?? cat.frequency}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatINR(annual)}
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
