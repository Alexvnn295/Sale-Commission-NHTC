import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Deal, SalesPerson } from '../types';
import { formatVND, calculateProgressiveTax, calculateFreelanceTaxForDeal } from '../taxUtils';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart2, 
  Calendar, 
  Users, 
  Briefcase, 
  Clock, 
  Filter, 
  ArrowUpRight, 
  RefreshCw,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AnalyticsChartsProps {
  deals: Deal[];
  salespersons: SalesPerson[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ deals, salespersons }) => {
  // Report options states
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [salespersonFilter, setSalespersonFilter] = React.useState<string>('ALL');
  const [reportTab, setReportTab] = React.useState<'overview' | 'monthly' | 'staff' | 'project'>('overview');

  // Search input for projects within reports tab
  const [projectSearch, setProjectSearch] = React.useState<string>('');

  // 1. Apply multi-dimensional date & scope filters to local data context
  const filteredDeals = React.useMemo(() => {
    return deals.filter(deal => {
      // Date range filter
      if (startDate && deal.date < startDate) return false;
      if (endDate && deal.date > endDate) return false;

      // Status filter
      if (statusFilter !== 'ALL' && deal.status !== statusFilter) return false;

      // Salespersons filter
      if (salespersonFilter !== 'ALL' && deal.salespersonId !== salespersonFilter) return false;

      return true;
    });
  }, [deals, startDate, endDate, statusFilter, salespersonFilter]);

  // Preset Date Helper
  const setRangePreset = (range: 'ALL' | 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR') => {
    const today = new Date('2026-06-18'); // Keep consistent with system year reference
    if (range === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (range === 'THIS_MONTH') {
      const year = today.getFullYear();
      const month = today.getMonth(); // 0-indexed
      const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
    } else if (range === 'THIS_QUARTER') {
      const year = today.getFullYear();
      const month = today.getMonth();
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const start = `${year}-${String(quarterStartMonth + 1).padStart(2, '0')}-01`;
      const quarterEndMonth = quarterStartMonth + 2;
      const lastDay = new Date(year, quarterEndMonth + 1, 0).getDate();
      const end = `${year}-${String(quarterEndMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
    } else if (range === 'THIS_YEAR') {
      const year = today.getFullYear();
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
    }
  };

  // Reset all filters in report dashboard
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('ALL');
    setSalespersonFilter('ALL');
    setProjectSearch('');
  };

  // 2. [REPORT 1]: Grouped by Salesperson (Hiệu suất theo Nhân Viên)
  const salesMap = React.useMemo(() => {
    const map: Record<string, { id: string; name: string; contractType: string; dealsCount: number; revenue: number; commission: number; pit: number; net: number }> = {};
    salespersons.forEach((sp) => {
      map[sp.id] = { id: sp.id, name: sp.name, contractType: sp.contractType, dealsCount: 0, revenue: 0, commission: 0, pit: 0, net: 0 };
    });

    // Accumulate revenue and base commission
    filteredDeals.forEach((deal) => {
      const spId = deal.salespersonId;
      if (map[spId]) {
        map[spId].dealsCount += 1;
        map[spId].revenue += deal.amount;
        map[spId].commission += deal.amount * deal.commissionRate;
      }
    });

    // Calculate PIT per salesperson in the selected interval.
    // Standard Vietnamese rules dictate monthly tax brackets. To prevent over-taxing during cumulative periods,
    // we group deals of each salesperson by month first, calculate monthly tax, then sum them up!
    Object.keys(map).forEach(spId => {
      const sp = salespersons.find(item => item.id === spId);
      if (!sp) return;

      const spDeals = filteredDeals.filter(d => d.salespersonId === spId);
      
      if (sp.contractType === 'HD_LAO_DONG') {
        // Group the approved/paid deals by Year-Month
        const monthGroup: Record<string, number> = {};
        spDeals.forEach(d => {
          if (d.status === 'APPROVED' || d.status === 'PAID') {
            const mKey = d.date.substring(0, 7); // 'YYYY-MM'
            monthGroup[mKey] = (monthGroup[mKey] || 0) + (d.amount * d.commissionRate);
          }
        });

        let spPITTotal = 0;
        // Compute progressive tax for each active month
        Object.keys(monthGroup).forEach(mKey => {
          const mAmt = monthGroup[mKey];
          const calculated = calculateProgressiveTax(sp.baseSalary, mAmt, sp.dependents);
          spPITTotal += calculated.totalTax;
        });

        map[spId].pit = spPITTotal;
      } else {
        // Casual vãng lai 10% per transaction if commission >= 2M
        let spPITTotal = 0;
        spDeals.forEach(d => {
          if (d.status === 'APPROVED' || d.status === 'PAID') {
            const comm = d.amount * d.commissionRate;
            spPITTotal += calculateFreelanceTaxForDeal(comm);
          }
        });
        map[spId].pit = spPITTotal;
      }

      map[spId].net = map[spId].commission - map[spId].pit;
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredDeals, salespersons]);

  // 3. [REPORT 2]: Grouped by Month (Biến thiên doanh thú theo Tháng)
  const monthlyReport = React.useMemo(() => {
    const monthsGroup: Record<string, { monthKey: string; monthLabel: string; dealsCount: number; revenue: number; commission: number; pit: number; net: number }> = {};
    
    // Find all months where we have filtered deals
    filteredDeals.forEach(deal => {
      const monthKey = deal.date.substring(0, 7); // 'YYYY-MM'
      const [year, month] = monthKey.split('-');
      const monthLabel = `Tháng ${month}/${year}`;

      if (!monthsGroup[monthKey]) {
        monthsGroup[monthKey] = {
          monthKey,
          monthLabel,
          dealsCount: 0,
          revenue: 0,
          commission: 0,
          pit: 0,
          net: 0
        };
      }

      monthsGroup[monthKey].dealsCount += 1;
      monthsGroup[monthKey].revenue += deal.amount;
      monthsGroup[monthKey].commission += deal.amount * deal.commissionRate;
    });

    // Dynamically calculate accurate PIT for each month
    Object.keys(monthsGroup).forEach(mKey => {
      let monthPIT = 0;
      
      salespersons.forEach(sp => {
        const spDealsInMonth = filteredDeals.filter(d => 
          d.salespersonId === sp.id && 
          d.date.startsWith(mKey) && 
          (d.status === 'APPROVED' || d.status === 'PAID')
        );
        const spMonthComm = spDealsInMonth.reduce((sum, d) => sum + (d.amount * d.commissionRate), 0);
        
        if (sp.contractType === 'HD_LAO_DONG') {
          if (spDealsInMonth.length > 0) {
            const taxDetails = calculateProgressiveTax(sp.baseSalary, spMonthComm, sp.dependents);
            monthPIT += taxDetails.totalTax;
          }
        } else {
          spDealsInMonth.forEach(d => {
            const comm = d.amount * d.commissionRate;
            monthPIT += calculateFreelanceTaxForDeal(comm);
          });
        }
      });

      monthsGroup[mKey].pit = monthPIT;
      monthsGroup[mKey].net = monthsGroup[mKey].commission - monthPIT;
    });

    return Object.values(monthsGroup).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [filteredDeals, salespersons]);

  // 4. [REPORT 3]: Grouped by Projects / Deals (Báo cáo chi tiết theo Dự án)
  const projectReport = React.useMemo(() => {
    const results = filteredDeals.map(deal => {
      const sp = salespersons.find(s => s.id === deal.salespersonId);
      const commission = deal.amount * deal.commissionRate;
      
      let pit = 0;
      if (deal.status === 'APPROVED' || deal.status === 'PAID') {
        if (sp?.contractType === 'V_LAI') {
          pit = calculateFreelanceTaxForDeal(commission);
        } else if (sp) {
          // For Labor contracts, PIT calculations aggregate monthly.
          // To assign a project PIT share, we determine the proportional share of PIT for this month's commissions.
          const monthKey = deal.date.substring(0, 7);
          const spDealsInMonth = deals.filter(d => 
            d.salespersonId === sp.id && 
            d.date.startsWith(monthKey) && 
            (d.status === 'APPROVED' || d.status === 'PAID')
          );
          const totalMonthComm = spDealsInMonth.reduce((sum, d) => sum + (d.amount * d.commissionRate), 0);
          const fullMonthTaxResult = calculateProgressiveTax(sp.baseSalary, totalMonthComm, sp.dependents);
          
          if (totalMonthComm > 0) {
            pit = (commission / totalMonthComm) * fullMonthTaxResult.totalTax;
          }
        }
      }

      return {
        ...deal,
        salespersonName: sp?.name || 'Không xác định',
        contractType: sp?.contractType,
        commission,
        pit,
        net: commission - pit
      };
    });

    // Apply project search query
    if (projectSearch.trim()) {
      const query = projectSearch.toLowerCase();
      return results.filter(item => 
        item.code.toLowerCase().includes(query) || 
        item.customerName.toLowerCase().includes(query) || 
        item.salespersonName.toLowerCase().includes(query)
      );
    }

    return results.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredDeals, salespersons, projectSearch, deals]);

  // Status breakdown calculations reactive to active filters
  const statusData = React.useMemo(() => {
    let pendingAmt = 0, pendingCount = 0;
    let approvedAmt = 0, approvedCount = 0;
    let paidAmt = 0, paidCount = 0;

    filteredDeals.forEach((deal) => {
      const comm = deal.amount * deal.commissionRate;
      if (deal.status === 'PENDING') {
        pendingCount++;
        pendingAmt += comm;
      } else if (deal.status === 'APPROVED') {
        approvedCount++;
        approvedAmt += comm;
      } else if (deal.status === 'PAID') {
        paidCount++;
        paidAmt += comm;
      }
    });

    return [
      { name: 'Chờ duyệt', value: pendingAmt, count: pendingCount, color: '#f59e0b' },
      { name: 'Đã duyệt (Chờ chi)', value: approvedAmt, count: approvedCount, color: '#3b82f6' },
      { name: 'Đã thanh toán', value: paidAmt, count: paidCount, color: '#10b981' },
    ].filter(item => item.value > 0 || item.count > 0);
  }, [filteredDeals]);

  // Total reactive metrics summing
  const statsSummary = React.useMemo(() => {
    let revenue = 0;
    let commission = 0;
    let pit = 0;

    filteredDeals.forEach(deal => {
      revenue += deal.amount;
      commission += deal.amount * deal.commissionRate;
    });

    // Sum of PIT of filtered employees over active months
    salesMap.forEach(item => {
      pit += item.pit;
    });

    return {
      totalRevenue: revenue,
      totalCommission: commission,
      totalPIT: pit,
      totalNetCommission: commission - pit,
      dealsCount: filteredDeals.length
    };
  }, [filteredDeals, salesMap]);

  // Tooltip components
  const CustomTooltipBar = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 border border-slate-750 font-mono">
          <p className="font-sans font-bold text-slate-300 border-b border-white/10 pb-0.5">{data.name}</p>
          <p className="text-sky-450">Doanh thu: {formatVND(data.revenue)}</p>
          <p className="text-emerald-400">Hoa hồng: {formatVND(data.commission)}</p>
          <p className="text-pink-400">Thuế PIT: {formatVND(data.pit)}</p>
          <p className="text-amber-400 font-bold">Thực nhận: {formatVND(data.net)}</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 border border-slate-750 font-mono">
          <p className="font-sans font-bold text-slate-300">{data.name}</p>
          <p className="text-sky-400">Số dự án: {data.count}</p>
          <p className="text-amber-400 font-bold">Lũy kế: {formatVND(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4" id="advanced-reports-module">
      {/* 1. Header Filter Controls Panel */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-tight">Bộ Lọc Báo Cáo Chuyên Sâu</h3>
              <p className="text-[10px] text-slate-400 font-medium">Lọc số liệu tổng hợp trong phân hệ báo cáo tài chính toàn diện</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-600 rounded-lg text-[10.5px] font-bold transition-all"
            title="Đặt lại bộ lọc về mặc định"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Xóa Toàn Bộ Lọc
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Custom Date Range */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">Từ ngày</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-250 rounded-lg text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">Đến ngày</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-250 rounded-lg text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Status filter selection */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">Trạng thái duyệt chi</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 text-slate-850 text-xs rounded-lg p-2 outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">🔍 Tất cả trạng thái</option>
              <option value="PENDING">🟡 Chờ duyệt chi</option>
              <option value="APPROVED">🔵 Đã duyệt (Chờ chi)</option>
              <option value="PAID">🟢 Đã chi trả</option>
            </select>
          </div>

          {/* Salesperson Filter Selection */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">Nhân sự phụ trách</label>
            <select
              value={salespersonFilter}
              onChange={(e) => setSalespersonFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 text-slate-850 text-xs rounded-lg p-2 outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">👤 Tất cả Sales</option>
              {salespersons.map(s => (
                <option key={s.id} value={s.id}>👤 {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date presets line */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Bộ lọc nhanh thời gian:</span>
          <button
            onClick={() => setRangePreset('ALL')}
            className={`px-2.5 py-1 rounded text-[10.5px] font-bold transition-all border ${
              !startDate && !endDate ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
            }`}
          >
            Mọi lúc
          </button>
          <button
            onClick={() => setRangePreset('THIS_MONTH')}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100 rounded text-[10.5px] font-bold transition-all"
          >
            Tháng này
          </button>
          <button
            onClick={() => setRangePreset('THIS_QUARTER')}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100 rounded text-[10.5px] font-bold transition-all"
          >
            Quý này
          </button>
          <button
            onClick={() => setRangePreset('THIS_YEAR')}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100 rounded text-[10.5px] font-bold transition-all"
          >
            Năm 2026
          </button>
        </div>
      </div>

      {/* 2. Mini summary cards specific to selected filters in reporting tab */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-indigo-900 text-white rounded-xl p-3 border border-indigo-800 flex flex-col justify-between shadow-xs">
          <span className="text-[9px] uppercase font-bold text-indigo-300 tracking-wider">Hợp đồng lọc được</span>
          <p className="text-base font-black font-mono mt-1">{statsSummary.dealsCount} HĐ/PO</p>
          <span className="text-[9px] text-indigo-250 italic mt-1 font-medium">Trong khoảng thời gian</span>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Doanh thu ghi nhận</span>
          <p className="text-base font-black text-slate-850 font-mono mt-1">{formatVND(statsSummary.totalRevenue)}</p>
          <div className="w-full bg-slate-100 h-1 rounded overflow-hidden mt-1 bg-gradient-to-r from-sky-400 to-indigo-500"></div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider">Hoa hồng phát sinh</span>
          <p className="text-base font-black text-emerald-700 font-mono mt-1">{formatVND(statsSummary.totalCommission)}</p>
          <span className="text-[9px] text-slate-400 font-mono mt-1">Lũy kế gộp</span>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-red-500 tracking-wider">Thuế TNCN tạm tính</span>
          <p className="text-base font-black text-red-600 font-mono mt-1">{formatVND(statsSummary.totalPIT)}</p>
          <span className="text-[9px] text-red-400 font-medium mt-1">Khấu trừ tại nguồn</span>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[9px] uppercase font-bold text-amber-600 tracking-wider">Thực nhận đội ngũ</span>
          <p className="text-base font-black text-amber-700 font-mono mt-1">{formatVND(statsSummary.totalNetCommission)}</p>
          <span className="text-[9px] text-slate-400 font-medium mt-1">Net sau khi thu thuế</span>
        </div>
      </div>

      {/* 3. Reporting Tab Switcher */}
      <div className="bg-slate-200/60 p-1 rounded-xl flex flex-wrap gap-1">
        <button
          onClick={() => { setReportTab('overview'); }}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            reportTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-650 hover:bg-white hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Biểu Đồ Tổng Quan</span>
        </button>

        <button
          onClick={() => { setReportTab('monthly'); }}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            reportTab === 'monthly'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-650 hover:bg-white hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Báo Cáo Theo Tháng</span>
        </button>

        <button
          onClick={() => { setReportTab('staff'); }}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            reportTab === 'staff'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-650 hover:bg-white hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Báo Cáo Theo Nhân Viên</span>
        </button>

        <button
          onClick={() => { setReportTab('project'); }}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            reportTab === 'project'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-650 hover:bg-white hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Báo Cáo Theo Dự Án</span>
        </button>
      </div>

      {/* 4. Active Report Contents */}
      {reportTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Salesperson performance bar chart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="performance-chart">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <BarChart2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-850 text-xs uppercase tracking-tight">Doanh Số & Hoa Hồng Đội Ngũ</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Doanh thu và hoa hồng gộp theo nhân sự (Khoảng lọc)</p>
                </div>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                Xếp hạng
              </span>
            </div>

            <div className="h-60 mt-2 w-full">
              {salesMap.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                  Không có dữ liệu nhân sự để vẽ biểu đồ trong khoảng lọc
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesMap}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltipBar />} />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                    <Bar 
                      dataKey="revenue" 
                      name="Doanh thu hợp đồng" 
                      fill="#475569" 
                      radius={[3, 3, 0, 0]} 
                      maxBarSize={22}
                    />
                    <Bar 
                      dataKey="commission" 
                      name="Hoa hồng phát sinh" 
                      fill="#10b981" 
                      radius={[3, 3, 0, 0]} 
                      maxBarSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Deal status distribution chart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="status-distribution-chart">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <PieIcon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-850 text-xs uppercase tracking-tight">Cơ Cấu Trạng Thái Hoa Hồng</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Tỷ trọng dòng tiền chi trả dựa trên trạng thái</p>
                </div>
              </div>
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Tỷ lệ %
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div className="h-52 col-span-3 w-full">
                {statusData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                    Chưa có số liệu hợp đồng để phân bổ trạng thái
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltipPie />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="col-span-2 space-y-2.5">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái duyệt chi</h5>
                {statusData.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Không có dữ liệu hợp đồng</p>
                ) : (
                  statusData.map((item, idx) => {
                    const percentage = statsSummary.totalCommission > 0 ? ((item.value / statsSummary.totalCommission) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={idx} className="flex flex-col gap-0.5 border-b border-slate-50 pb-1">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: item.color }}></span>
                            <span className="font-semibold text-slate-700">{item.name}</span>
                          </div>
                          <span className="font-bold text-slate-900 font-mono text-[11px]">{percentage}%</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 pl-3.5">
                          <span>{item.count} thầu</span>
                          <span className="font-mono">{formatVND(item.value)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY REPORT TAB */}
      {reportTab === 'monthly' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="font-bold text-slate-850 text-xs uppercase tracking-tight flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-650" />
                <span>BÁO CÁO DOANH SỐ & HOA HỒNG THEO THÁNG</span>
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">Lũy kế các hợp đồng phát sinh/nghiệm thu định kỳ hàng tháng</p>
            </div>
          </div>

          {/* Area/Line Trend Graph */}
          {monthlyReport.length > 0 && (
            <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-150">
              <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5">Trực quan biểu đồ biến thiên theo chu kỳ tháng</h5>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyReport}
                    margin={{ top: 5, right: 10, left: 15, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#475569" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="monthLabel" 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltipBar />} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Doanh thu hợp đồng" 
                      stroke="#475569" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="commission" 
                      name="Hoa hồng phát sinh" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorCommission)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table Breakdown */}
          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            <table className="w-full text-xs text-left text-slate-650">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Thời gian</th>
                  <th className="py-2.5 px-4 text-center">Số Hợp đồng</th>
                  <th className="py-2.5 px-4 text-right">Doanh thu thu về</th>
                  <th className="py-2.5 px-4 text-right">Hoa hồng gộp</th>
                  <th className="py-2.5 px-4 text-right text-red-650">PIT Khấu trừ</th>
                  <th className="py-2.5 px-4 text-right text-emerald-700">Thực nhận (Net)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyReport.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Không tìm thấy bất kỳ giao dịch/hợp đồng nào phát sinh trong khoảng thời gian này
                    </td>
                  </tr>
                ) : (
                  monthlyReport.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors font-mono">
                      <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{m.monthLabel}</td>
                      <td className="py-2.5 px-4 text-center font-sans font-semibold text-slate-600">{m.dealsCount} dự án</td>
                      <td className="py-2.5 px-4 text-right text-slate-800">{formatVND(m.revenue)}</td>
                      <td className="py-2.5 px-4 text-right text-slate-900 font-semibold">{formatVND(m.commission)}</td>
                      <td className="py-2.5 px-4 text-right text-red-500">{formatVND(m.pit)}</td>
                      <td className="py-2.5 px-4 text-right text-emerald-700 font-bold bg-emerald-50/20">{formatVND(m.net)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {monthlyReport.length > 0 && (
                <tfoot className="bg-slate-950 text-white font-bold border-t border-slate-900 font-mono">
                  <tr>
                    <td className="py-2.5 px-4 font-sans text-xs">Tổng hợp khoảng lọc</td>
                    <td className="py-2.5 px-4 text-center font-sans">{statsSummary.dealsCount} dự án</td>
                    <td className="py-2.5 px-4 text-right">{formatVND(statsSummary.totalRevenue)}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-400">{formatVND(statsSummary.totalCommission)}</td>
                    <td className="py-2.5 px-4 text-right text-red-400">{formatVND(statsSummary.totalPIT)}</td>
                    <td className="py-2.5 px-4 text-right text-amber-300 font-extrabold bg-slate-900">{formatVND(statsSummary.totalNetCommission)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* STAFF REPORT TAB */}
      {reportTab === 'staff' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div>
            <h4 className="font-bold text-slate-850 text-xs uppercase tracking-tight flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-650" />
              <span>BÁO CÁO CÔNG NỢ & HOA HỒNG THEO NHÂN VIÊN</span>
            </h4>
            <p className="text-[10px] text-slate-400 font-medium">Bảng theo dõi tổng hợp doanh số và thuế PIT lũy kế riêng của từng Sale trong kỳ báo cáo</p>
          </div>

          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            <table className="w-full text-xs text-left text-slate-650">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Đại diện kinh doanh</th>
                  <th className="py-2.5 px-4">Diện hợp đồng</th>
                  <th className="py-2.5 px-4 text-center">Số dự án thầu</th>
                  <th className="py-2.5 px-4 text-right">Doanh thu mang về</th>
                  <th className="py-2.5 px-4 text-right">Hoa hồng phát sinh</th>
                  <th className="py-2.5 px-4 text-right text-red-650 font-semibold">Thuế TNCN trích giữ</th>
                  <th className="py-2.5 px-4 text-right text-emerald-700 font-bold">Thực nhận (Net)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesMap.map((sp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors font-mono">
                    <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{sp.name}</td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                        sp.contractType === 'HD_LAO_DONG' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {sp.contractType === 'HD_LAO_DONG' ? 'Chính thức' : 'Cộng tác viên (CTV)'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-sans text-slate-650 font-semibold">{sp.dealsCount} dự án</td>
                    <td className="py-2.5 px-4 text-right text-slate-800">{formatVND(sp.revenue)}</td>
                    <td className="py-2.5 px-4 text-right text-slate-950 font-semibold">{formatVND(sp.commission)}</td>
                    <td className="py-2.5 px-4 text-right text-red-500 font-semibold">{formatVND(sp.pit)}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-700 font-bold bg-emerald-50/20">{formatVND(sp.net)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 text-white font-bold border-t border-slate-900 font-mono">
                <tr>
                  <td colSpan={2} className="py-2.5 px-4 font-sans text-xs">Tổng hợp đội ngũ trong khoảng lọc</td>
                  <td className="py-2.5 px-4 text-center font-sans">{statsSummary.dealsCount} dự án</td>
                  <td className="py-2.5 px-4 text-right">{formatVND(statsSummary.totalRevenue)}</td>
                  <td className="py-2.5 px-4 text-right text-emerald-400">{formatVND(statsSummary.totalCommission)}</td>
                  <td className="py-2.5 px-4 text-right text-red-400">{formatVND(statsSummary.totalPIT)}</td>
                  <td className="py-2.5 px-4 text-right text-amber-300 font-extrabold bg-slate-900">{formatVND(statsSummary.totalNetCommission)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* PROJECT REPORT TAB */}
      {reportTab === 'project' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="font-bold text-slate-850 text-xs uppercase tracking-tight flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-650" />
                <span>BÁO CÁO DOANH THU & COMMISSION CHI TIẾT THEO DỰ ÁN</span>
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">Liệt kê tất cả các HĐ, đơn thầu PO phát sinh kèm tỷ lệ hoa hồng cụ thể từng hạng mục</p>
            </div>

            {/* Quick search inside project reports */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Tìm Mã HĐ, Khách hàng, Sale..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-55 border border-slate-250 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            <table className="w-full text-xs text-left text-slate-650">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Mã Dự Án</th>
                  <th className="py-2.5 px-4">Tên Khách Hàng</th>
                  <th className="py-2.5 px-4">Người phụ trách</th>
                  <th className="py-2.5 px-4 text-center">Ngày ký</th>
                  <th className="py-2.5 px-4 text-right">Doanh số</th>
                  <th className="py-2.5 px-4 text-center">Tỷ lệ</th>
                  <th className="py-2.5 px-4 text-right">Hoa hồng gộp</th>
                  <th className="py-2.5 px-4 text-right text-red-600">Trích thuế</th>
                  <th className="py-2.5 px-4 text-right text-emerald-700 font-bold">Thực nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectReport.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                      Không tìm thấy dự án/hợp đồng thầu nào phù hợp với bộ lọc và từ khóa tra cứu
                    </td>
                  </tr>
                ) : (
                  projectReport.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors font-mono">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{p.code}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-700 truncate max-w-[150px]" title={p.customerName}>{p.customerName}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-800">{p.salespersonName}</td>
                      <td className="py-2.5 px-4 text-center font-sans text-slate-600 text-[10.5px]">{p.date}</td>
                      <td className="py-2.5 px-4 text-right text-slate-800">{formatVND(p.amount)}</td>
                      <td className="py-2.5 px-4 text-center font-sans font-bold text-indigo-700 bg-indigo-50/80 rounded px-1.5 py-0.5 inline-block text-[10px] my-1 ml-auto mr-auto">{p.commissionRate * 100}%</td>
                      <td className="py-2.5 px-4 text-right text-slate-950 font-semibold">{formatVND(p.commission)}</td>
                      <td className="py-2.5 px-4 text-right">
                        {p.status === 'PENDING' ? (
                          <span className="text-slate-400 text-[9px] italic font-sans font-medium flex items-center justify-end gap-1">
                            <AlertCircle className="w-3 h-3 text-slate-350 shrink-0" /> Chờ duyệt
                          </span>
                        ) : (
                          <span className="text-red-500 font-semibold">{formatVND(p.pit)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right text-emerald-700 font-bold bg-emerald-50/10">
                        {p.status === 'PENDING' ? (
                          <span className="text-slate-400 text-[9px] italic font-sans font-medium">Chờ duyệt</span>
                        ) : (
                          formatVND(p.net)
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {projectReport.length > 0 && (
                <tfoot className="bg-slate-950 text-white font-bold border-t border-slate-900 font-mono">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-4 font-sans text-xs">Tổng hợp danh mục thầu</td>
                    <td className="py-2.5 px-4 text-right">{formatVND(statsSummary.totalRevenue)}</td>
                    <td className="py-2.5 px-4 text-center font-sans">-</td>
                    <td className="py-2.5 px-4 text-right text-emerald-400">{formatVND(statsSummary.totalCommission)}</td>
                    <td className="py-2.5 px-4 text-right text-red-400">{formatVND(statsSummary.totalPIT)}</td>
                    <td className="py-2.5 px-4 text-right text-amber-300 font-extrabold bg-slate-900">{formatVND(statsSummary.totalNetCommission)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

