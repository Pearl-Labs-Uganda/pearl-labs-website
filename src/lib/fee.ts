export const MODULE_NAMES = [
  "AI & Coding",
  "Robotics",
  "Aerospace CAD & 3D Printing",
] as const;

const SINGLE_MODULE_FEE = 500_000;
const MULTI_MODULE_FEE_PER_MODULE = 450_000;

export function computeAmountDue(modules: string[], hasSiblingDiscount = false): number {
  const count = modules.length;
  if (count === 0) return 0;
  const perModule =
    count >= 2 || hasSiblingDiscount ? MULTI_MODULE_FEE_PER_MODULE : SINGLE_MODULE_FEE;
  return count * perModule;
}

export function formatUgx(amount: number): string {
  return `UGX ${amount.toLocaleString("en-US")}`;
}
