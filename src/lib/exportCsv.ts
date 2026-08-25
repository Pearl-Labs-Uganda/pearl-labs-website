import type { RegistrationRow } from "./registrations";

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatCsvDateTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getRegistrationStatus(r: RegistrationRow): string {
  if (r.verified) return "Verified";
  if (r.paymentMethod === "Cash") return "Paying Cash";
  if (r.transactionId) return "Awaiting Verification";
  return "Unpaid";
}

export function generateRegistrationsCsv(registrations: RegistrationRow[]): string {
  const headers = [
    "Date Registered",
    "Student Name",
    "Age",
    "Gender",
    "School",
    "Class / Grade",
    "Cohort",
    "Modules",
    "Has Laptop",
    "Parent Name",
    "Phone",
    "Alt Phone",
    "Email",
    "Pickup Service",
    "Amount Due (UGX)",
    "Payment Method",
    "Transaction ID",
    "Status",
  ];

  const rows = registrations.map((r) => {
    const pickup =
      r.pickupService === "Yes" && r.pickupLocation
        ? `Yes (${r.pickupLocation})`
        : r.pickupService || "No";

    return [
      formatCsvDateTime(r.createdAt),
      r.studentName,
      r.age,
      r.gender,
      r.school,
      r.classGrade,
      r.cohort,
      r.modules.join(", "),
      r.hasLaptop,
      r.parentName,
      r.phone,
      r.altPhone || "",
      r.email,
      pickup,
      r.amountDue,
      r.paymentMethod || "MTN MoMo",
      r.transactionId || "",
      getRegistrationStatus(r),
    ];
  });

  return (
    "\uFEFF" +
    [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((row) => row.map(escapeCsvCell).join(",")),
    ].join("\r\n")
  );
}

export function downloadRegistrationsCsv(registrations: RegistrationRow[], filename?: string): void {
  const csvData = generateRegistrationsCsv(registrations);
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("download", filename ?? `pearl-labs-registrations-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
