import React from 'react';
import { SalesPerson, Deal, PITDetailedTax } from '../types';
import { calculateProgressiveTax, calculateFreelanceTaxForDeal, formatVND } from '../taxUtils';
import { 
  Calculator, 
  User, 
  HelpCircle, 
  ChevronRight, 
  Receipt, 
  Percent, 
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

interface TaxCalculatorViewProps {
  salespersons: SalesPerson[];
  deals: Deal[];
}

export const TaxCalculatorView: React.FC<TaxCalculatorViewProps> = ({ salespersons, deals }) => {
  const [selectedSpId, setSelectedSpId] = React.useState<string>(salespersons[0]?.id || '');

  const person = React.useMemo(() => {
    return salespersons.find(sp => sp.id === selectedSpId);
  }, [salespersons, selectedSpId]);

  // Calculate total approved/paid commissions for this salesperson
  const individualDeals = React.useMemo(() => {
    return deals.filter(deal => deal.salespersonId === selectedSpId);
  }, [deals, selectedSpId]);

  const activeCommissions = React.useMemo(() => {
    // Only count APPROVED and PAID commissions for real tax calculations
    return individualDeals
      .filter(deal => deal.status === 'APPROVED' || deal.status === 'PAID')
      .reduce((sum, deal) => sum + (deal.amount * deal.commissionRate), 0);
  }, [individualDeals]);

  // Render progressive tax details if HĐLĐ, or individual flat tax if Casul vãng lai
  const taxDetail = React.useMemo(() => {
    if (!person || person.contractType !== 'HD_LAO_DONG') return null;
    return calculateProgressiveTax(person.baseSalary, activeCommissions, person.dependents);
  }, [person, activeCommissions]);

  // Freelance casual tax detail calculations
  const freelanceTaxResults = React.useMemo(() => {
    if (!person || person.contractType !== 'V_LAI') return null;
    
    let totalGrossCommission = 0;
    let totalTaxPaid = 0;

    const items = individualDeals.map(deal => {
      const comm = deal.amount * deal.commissionRate;
      const isTaxable = deal.status === 'APPROVED' || deal.status === 'PAID';
      const tax = isTaxable ? calculateFreelanceTaxForDeal(comm) : 0;
      
      if (isTaxable) {
        totalGrossCommission += comm;
        totalTaxPaid += tax;
      }
      return {
        deal,
        commission: comm,
        tax,
        isTaxable,
      };
    });

    return {
      items,
      totalGrossCommission,
      totalTaxPaid,
      netCommission: totalGrossCommission - totalTaxPaid
    };
  }, [person, individualDeals]);

  if (!person) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 text-center text-slate-400">
        Vui lòng chọn nhân viên kinh doanh để kiểm tra chi tiết thuế TNCN.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6" id="tax-explanation-tool">
      {/* Selector of Salesperson */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <h4 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
            <Calculator className="w-5 h-5 text-indigo-500" />
            Tra Cứu & Trực Quan Hóa Thuế TNCN
          </h4>
          <p className="text-xs text-slate-500">Mô phỏng chi tiết các bước tính toán khấu trừ thuế hợp lệ theo quy chế và pháp luật</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label htmlFor="salesperson-select" className="text-xs font-semibold text-slate-600 whitespace-nowrap">Chọn Sale:</label>
          <select
            id="salesperson-select"
            value={selectedSpId}
            onChange={(e) => setSelectedSpId(e.target.value)}
            className="w-full md:w-64 bg-slate-55 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-2.5 outline-none font-medium transition-all"
          >
            {salespersons.map(sp => (
              <option key={sp.id} value={sp.id}>
                {sp.name} ({sp.contractType === 'HD_LAO_DONG' ? 'HĐ Lao Động' : 'Freelance / Vãng lai'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Meta Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Nhân viên</span>
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-450" />
            {person.name}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Hình thức hợp đồng</span>
          <p className="text-sm font-semibold text-slate-800">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
              person.contractType === 'HD_LAO_DONG' 
                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {person.contractType === 'HD_LAO_DONG' ? 'HĐ Lao Động (Chính thức)' : 'Vãng lai (Freelancer / CTV)'}
            </span>
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Lương cơ bản</span>
          <p className="text-sm font-bold text-slate-700">
            {person.contractType === 'HD_LAO_DONG' ? formatVND(person.baseSalary) : 'N/A'}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Người phụ thuộc</span>
          <p className="text-sm font-bold text-indigo-650">
            {person.contractType === 'HD_LAO_DONG' ? `${person.dependents} người` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Progressive Tax Path (For official Employees HĐLĐ) */}
      {person.contractType === 'HD_LAO_DONG' && taxDetail && (
        <div className="space-y-6">
          {/* Detailed Financial Summary Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-100 bg-white p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-500 font-medium">Tổng thu nhập chịu thuế (Gross)</span>
              <p className="text-xl font-extrabold text-slate-800">{formatVND(taxDetail.grossIncome)}</p>
              <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2">
                <span>Lương: {formatVND(taxDetail.baseSalaryComponent)}</span>
                <span>•</span>
                <span>Hoa hồng duyệt: {formatVND(taxDetail.commissionComponent)}</span>
              </div>
            </div>

            <div className="border border-slate-100 bg-white p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-500 font-medium font-viet">Tổng các khoản giảm trừ (-)</span>
              <p className="text-xl font-extrabold text-amber-600">-{formatVND(taxDetail.deductions.total)}</p>
              <div className="text-[10px] text-slate-400">
                Bản thân: 11M | GGT: {person.dependents * 4.4}M | BH: {formatVND(taxDetail.deductions.insurance)}
              </div>
            </div>

            <div className="border-2 border-indigo-50 bg-indigo-50/20 p-4 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-indigo-600">Thu nhập tính thuế (VND)</span>
              <p className="text-xl font-extrabold text-indigo-700">{formatVND(taxDetail.taxableIncome)}</p>
              <p className="text-[10px] text-indigo-500 font-medium italic">
                {taxDetail.taxableIncome > 0 
                  ? 'Là căn cứ để áp dụng biểu thuế lũy tiến từng phần' 
                  : 'Thu nhập dưới mức chịu thuế (Thuế TNCN = 0 VND)'}
              </p>
            </div>
          </div>

          {/* Deductions breakdown explanation */}
          <div className="border border-slate-100 rounded-xl p-4 space-y-3">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1">
              <Receipt className="w-4 h-4 text-emerald-500" />
              Chi Tiết Các Khoản Giảm Trừ Thuế Luật Định
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-2">
              <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>1. Bản thân người nộp thuế</span>
                  <span className="text-slate-900">{formatVND(taxDetail.deductions.personal)}</span>
                </div>
                <p className="text-[11px] text-slate-400">Giảm trừ mặc định 11 triệu VND/tháng theo luật thuế TNCN hiện hành.</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>2. Cho {person.dependents} người phụ thuộc</span>
                  <span className="text-slate-900">{formatVND(taxDetail.deductions.dependents)}</span>
                </div>
                <p className="text-[11px] text-slate-400">Mức 4,4 triệu VND/người/tháng. Đã đăng ký mã số thuế người phụ thuộc.</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>3. Bảo hiểm bắt buộc BHXH (10.5%)</span>
                  <span className="text-slate-900">{formatVND(taxDetail.deductions.insurance)}</span>
                </div>
                <p className="text-[11px] text-slate-400">8% Hưu trí, 1.5% BHYT, 1% BHTN tính trên lương cơ bản (max trần 46.8 triệu VND).</p>
              </div>
            </div>
          </div>

          {/* Progressive Brackets Steps Table */}
          {taxDetail.taxableIncome > 0 && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-indigo-500" />
                Bảng Phân Tích Lũy Tiến Từng Giai Đoạn (Lũy Tiến Từng Phần)
              </h5>
              <div className="overflow-x-auto border border-slate-150 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-bold">
                      <th className="py-2.5 px-4 text-center w-12">Bậc</th>
                      <th className="py-2.5 px-4">Khoảng thu nhập tính thuế</th>
                      <th className="py-2.5 px-4 text-center w-24">Thuế suất</th>
                      <th className="py-2.5 px-4 text-right">Thu nhập trong bậc</th>
                      <th className="py-2.5 px-4 text-right">Thuế phát sinh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {taxDetail.brackets.map((bracket) => {
                      const isActive = bracket.incomeInBracket > 0;
                      return (
                        <tr 
                          key={bracket.level} 
                          className={`hover:bg-slate-50/55 transition-colors ${
                            isActive ? 'bg-indigo-50/10 font-medium' : 'text-slate-400'
                          }`}
                        >
                          <td className="py-2.5 px-4 text-center font-bold">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                              isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {bracket.level}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">{bracket.range}</td>
                          <td className="py-2.5 px-4 text-center font-semibold text-slate-900">
                            {(bracket.rate * 100).toFixed(0)}%
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono">
                            {formatVND(bracket.incomeInBracket)}
                          </td>
                          <td className={`py-2.5 px-4 text-right font-bold font-mono ${
                            bracket.taxInBracket > 0 ? 'text-indigo-600' : 'text-slate-400'
                          }`}>
                            {formatVND(bracket.taxInBracket)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom Total Computation Box */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-slate-900 text-white rounded-xl p-5 gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Kết quả tổng hợp (Thời gian thực)</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span className="text-lg font-bold text-slate-100">Tổng thu nhập: {formatVND(taxDetail.grossIncome)}</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 font-medium">Thuế TNCN khấu trừ: {formatVND(taxDetail.totalTax)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-lg md:text-right">
              <div>
                <p className="text-xs text-white/70">Thực nhận cuối cùng (NET)</p>
                <p className="text-xl font-black text-emerald-400 tracking-tight">{formatVND(taxDetail.netIncome)}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-400 h-full hidden md:block" />
            </div>
          </div>
        </div>
      )}

      {/* Flat 10% PIT list (For Casual / Freelancers Vãng lai) */}
      {person.contractType === 'V_LAI' && freelanceTaxResults && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-100 bg-white p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-500 font-medium">Tổng Hoa Hồng Phát Sinh (Duyệt)</span>
              <p className="text-xl font-extrabold text-slate-800">{formatVND(freelanceTaxResults.totalGrossCommission)}</p>
            <p className="text-[10px] text-slate-400 font-viet">Cộng lũy kế từ hoa hồng của các hợp đồng có trạng thái Duyệt/Chi</p>
            </div>

            <div className="border border-slate-100 bg-white p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-500 font-medium">Thuế TNCN khấu trừ tại nguồn (10%)</span>
              <p className="text-xl font-extrabold text-amber-600">-{formatVND(freelanceTaxResults.totalTaxPaid)}</p>
              <p className="text-[10px] text-slate-400">Áp dụng 10% cho giao dịch hoa hồng từ 2M VND trở lên</p>
            </div>

            <div className="border-2 border-emerald-55 bg-emerald-50/15 p-4 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-emerald-600">Thực nhận cuối cùng sau thuế</span>
              <p className="text-xl font-black text-emerald-700">{formatVND(freelanceTaxResults.netCommission)}</p>
              <p className="text-[10px] text-emerald-500">Đã trừ thuế TNCN vãng lai trực tiếp từ hoa hồng</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" />
                Danh Sách Hợp Đồng Tính Thuế Từng Lần Phát Sinh (Thuế Vãng Lai)
              </h5>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                Bấm vào dòng Hợp đồng để tính tự động 10% thu nhập vãng lai
              </span>
            </div>

            {freelanceTaxResults.items.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">Không tìm thấy hợp đồng nào được giao cho Sale này.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-150 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-bold">
                      <th className="py-2.5 px-4">Mã HĐ</th>
                      <th className="py-2.5 px-4">Khách hàng</th>
                      <th className="py-2.5 px-4 text-right">Doanh thu</th>
                      <th className="py-2.5 px-4 text-right">Hoa hồng (Tỷ lệ)</th>
                      <th className="py-2.5 px-4 text-center">Thuế suất áp dụng</th>
                      <th className="py-2.5 px-4 text-right">Thuế TNCN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {freelanceTaxResults.items.map(({ deal, commission, tax, isTaxable }) => {
                      const isOver2M = commission >= 2000000;
                      return (
                        <tr key={deal.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{deal.code}</td>
                          <td className="py-2.5 px-4 truncate max-w-xs">{deal.customerName}</td>
                          <td className="py-2.5 px-4 text-right font-mono">{formatVND(deal.amount)}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800">
                            <div>{formatVND(commission)}</div>
                            <div className="text-[10px] text-slate-400 font-sans font-medium">({(deal.commissionRate * 100).toFixed(0)}%)</div>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {!isTaxable ? (
                              <span className="text-slate-400 italic">Chờ duyệt (chưa thu)</span>
                            ) : isOver2M ? (
                              <span className="text-red-700 bg-red-50 border border-red-100 text-[10px] px-2 py-0.5 rounded-full font-bold">10% (Hoa hồng ≥ 2M)</span>
                            ) : (
                              <span className="text-slate-500 bg-slate-100 text-[10px] px-2 py-0.5 rounded-full font-medium">0% (Hoa hồng &lt; 2M)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold font-mono text-red-600">
                            {tax > 0 ? formatVND(tax) : '0 ₫'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
