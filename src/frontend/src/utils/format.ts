export function formatINR(amount: bigint | number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export const INDIAN_CLASSES = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11 (Science)",
  "Class 11 (Commerce)",
  "Class 11 (Arts)",
  "Class 12 (Science)",
  "Class 12 (Commerce)",
  "Class 12 (Arts)",
];

export const FREQUENCY_LABELS: Record<string, string> = {
  annual: "Annual",
  termly: "Term-wise",
  monthly: "Monthly",
};

export function currentIndianAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  // Indian academic year: April to March
  const startYear = now.getMonth() >= 3 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

export function formatINRChart(v: number): string {
  if (v >= 100000) return `\u20B9${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `\u20B9${(v / 1000).toFixed(0)}k`;
  return `\u20B9${v}`;
}
