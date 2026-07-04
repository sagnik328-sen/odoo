import { describe, expect, it } from 'vitest'

import { formatNetSalary } from './payroll'

describe('formatNetSalary', () => {
  it('supports persisted API payslips', () => {
    expect(formatNetSalary({ net_salary: 5250 })).toBe('5250.00')
  })

  it('supports legacy dashboard data without crashing', () => {
    expect(formatNetSalary({ netSalary: 5350 })).toBe('5350.00')
    expect(formatNetSalary({})).toBe('0.00')
  })
})
