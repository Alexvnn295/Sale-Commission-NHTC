import { PITDetailedTax, ContractType, SalesPerson, Deal } from './types';

// Constants according to Vietnamese Tax Law in 2026
export const DECREE_PERSONAL_DEDUCTION = 11000000; // Giảm trừ gia cảnh bản thân (11,000,000 VND)
export const DECREE_DEPENDENT_DEDUCTION = 4400000; // Giảm trừ người phụ thuộc (4,400,000 VND)
export const INSURANCE_RATE = 0.105; // Tỷ lệ đóng BHXH (8% hưu trí, 1.5% BHYT, 1% BHTN = 10.5%)
export const CIVIL_SALARY_BASE = 2340000; // Mức lương cơ sở hiện tại (2,340,000 VND từ 1/7/2024)
export const MAX_INSURANCE_SALARY = 20 * CIVIL_SALARY_BASE; // Trần lương đóng BHXH (46,800,000 VND)

/**
 * Calculates progressive tax according to the Vietnamese progressive PIT chart:
 * - Bậc 1: Đến 5 triệu VND: 5%
 * - Bậc 2: Trên 5 triệu đến 10 triệu VND: 10% (Trừ 250k)
 * - Bậc 3: Trên 10 triệu đến 18 triệu VND: 15% (Trừ 750k)
 * - Bậc 4: Trên 18 triệu đến 32 triệu VND: 20% (Trừ 1,650k)
 * - Bậc 5: Trên 32 triệu đến 52 triệu VND: 25% (Trừ 3,250k)
 * - Bậc 6: Trên 52 triệu đến 80 triệu VND: 30% (Trừ 5,850k)
 * - Bậc 7: Trên 80 triệu VND: 35% (Trừ 9,850k)
 */
export function calculateProgressiveTax(
  baseSalary: number,
  approvedCommissions: number,
  dependents: number
): PITDetailedTax {
  const grossIncome = baseSalary + approvedCommissions;
  
  // Calculate Social Insurance Deduction (10.5% of base salary up to cap)
  const salaryForInsurance = Math.min(baseSalary, MAX_INSURANCE_SALARY);
  const insuranceDeduction = salaryForInsurance * INSURANCE_RATE;

  // Calculate Personal & Dependents Deductions
  const personalDeduction = DECREE_PERSONAL_DEDUCTION;
  const dependentsDeduction = dependents * DECREE_DEPENDENT_DEDUCTION;
  const totalDeductions = personalDeduction + dependentsDeduction + insuranceDeduction;

  // Taxable Income = Gross Income - Deductions (cannot be negative)
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  // Progressive Brackets
  const bracketsConfig = [
    { level: 1, limit: 5000000, rate: 0.05, range: '≤ 5 triệu' },
    { level: 2, limit: 10000000, rate: 0.10, range: '> 5 triệu đến 10 triệu' },
    { level: 3, limit: 18000000, rate: 0.15, range: '> 10 triệu đến 18 triệu' },
    { level: 4, limit: 32000000, rate: 0.20, range: '> 18 triệu đến 32 triệu' },
    { level: 5, limit: 52000000, rate: 0.25, range: '> 32 triệu đến 52 triệu' },
    { level: 6, limit: 80000000, rate: 0.30, range: '> 52 triệu đến 80 triệu' },
    { level: 7, limit: Infinity, rate: 0.35, range: '> 80 triệu' },
  ];

  let remainingTaxable = taxableIncome;
  let totalTax = 0;
  const bracketsResults: PITDetailedTax['brackets'] = [];

  let previousLimit = 0;
  for (const b of bracketsConfig) {
    if (remainingTaxable <= 0) {
      bracketsResults.push({
        level: b.level,
        range: b.range,
        rate: b.rate,
        incomeInBracket: 0,
        taxInBracket: 0,
      });
      continue;
    }

    const bracketWidth = b.limit - previousLimit;
    const incomeInBracket = Math.min(remainingTaxable, bracketWidth);
    const taxInBracket = incomeInBracket * b.rate;

    totalTax += taxInBracket;
    remainingTaxable -= incomeInBracket;
    previousLimit = b.limit;

    bracketsResults.push({
      level: b.level,
      range: b.range,
      rate: b.rate,
      incomeInBracket,
      taxInBracket,
    });
  }

  return {
    grossIncome,
    commissionComponent: approvedCommissions,
    baseSalaryComponent: baseSalary,
    deductions: {
      personal: personalDeduction,
      dependents: dependentsDeduction,
      insurance: insuranceDeduction,
      total: totalDeductions,
    },
    taxableIncome,
    brackets: bracketsResults,
    totalTax,
    netIncome: grossIncome - totalTax,
  };
}

/**
 * Calculates freelance tax (Thuế vãng lai):
 * - If commission/transaction is >= 2,000,000 VND, apply a flat 10% PIT.
 * - Otherwise, tax is 0.
 */
export function calculateFreelanceTaxForDeal(amount: number): number {
  if (amount >= 2000000) {
    return amount * 0.10;
  }
  return 0;
}

/**
 * Utility formater helper for Vietnam Dong
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
