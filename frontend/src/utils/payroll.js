export function formatNetSalary(payslip) {
  const value = Number(payslip?.net_salary ?? payslip?.netSalary ?? 0)
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}
