import React from 'react';
import { 
  Briefcase, 
  Coins, 
  FileText, 
  Users, 
  Calculator, 
  RotateCcw, 
  TrendingUp, 
  Receipt,
  UserCheck,
  Building,
  Activity,
  Award,
  HelpCircle,
  Clock,
  ArrowUpRight,
  Database,
  Mail
} from 'lucide-react';
import { SalesPerson, Deal, DealStatus, EmailNotification, AuditLog } from './types';
import { INITIAL_SALESPERSONS, INITIAL_DEALS } from './mockData';
import { calculateProgressiveTax, calculateFreelanceTaxForDeal, formatVND } from './taxUtils';
import { StatCard } from './components/StatCard';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { TaxCalculatorView } from './components/TaxCalculatorView';
import { SalesPersonList } from './components/SalesPersonList';
import { DealList } from './components/DealList';
import { NotificationCenter } from './components/NotificationCenter';
import { generateEmailContent } from './emailUtils';
import { AuditLogView } from './components/AuditLogView';
import { ClipboardList } from 'lucide-react';

export default function App() {
  // Try loading from localStorage, fallback to mock data
  const [salespersons, setSalespersons] = React.useState<SalesPerson[]>(() => {
    const saved = localStorage.getItem('sales_commission_persons');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_SALESPERSONS;
  });

  const [deals, setDeals] = React.useState<Deal[]>(() => {
    const saved = localStorage.getItem('sales_commission_deals');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_DEALS;
  });

  // Save changes to localStorage automatically
  React.useEffect(() => {
    localStorage.setItem('sales_commission_persons', JSON.stringify(salespersons));
  }, [salespersons]);

  React.useEffect(() => {
    localStorage.setItem('sales_commission_deals', JSON.stringify(deals));
  }, [deals]);

  // Email Notifications State
  const [notifications, setNotifications] = React.useState<EmailNotification[]>(() => {
    const saved = localStorage.getItem('sales_commission_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [autoTrigger, setAutoTrigger] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('sales_commission_auto_trigger');
    return saved !== null ? saved === 'true' : true;
  });

  const [bccAddress, setBccAddress] = React.useState<string>(() => {
    const saved = localStorage.getItem('sales_commission_bcc_address');
    return saved !== null ? saved : 'ban-giam-doc@company.com';
  });

  const [includePITDetails, setIncludePITDetails] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('sales_commission_inc_pit');
    return saved !== null ? saved === 'true' : true;
  });

  // Save changes to localStorage automatically for Email Notification system
  React.useEffect(() => {
    localStorage.setItem('sales_commission_notifications', JSON.stringify(notifications));
  }, [notifications]);

  React.useEffect(() => {
    localStorage.setItem('sales_commission_auto_trigger', String(autoTrigger));
  }, [autoTrigger]);

  React.useEffect(() => {
    localStorage.setItem('sales_commission_bcc_address', bccAddress);
  }, [bccAddress]);

  React.useEffect(() => {
    localStorage.setItem('sales_commission_inc_pit', String(includePITDetails));
  }, [includePITDetails]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('sales_commission_audit_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    // Seed gorgeous initial audit logs for compliance look-and-feel
    return [
      {
        id: 'audit-initial-1',
        dealId: 'deal-1',
        dealCode: 'PO-2026-001',
        customerName: 'Tập đoàn Vingroup',
        salespersonName: 'Nguyễn Văn Thuận',
        oldStatus: 'NEW',
        newStatus: 'PAID',
        changedBy: 'Ban Giám Đốc',
        timestamp: new Date(Date.now() - 48 * 60 * 65 * 1000).toISOString(),
        amount: 500000000,
        commission: 25000000,
        note: 'Giải ngân hoa hồng đợt 1 thành công cho PO ký mới'
      },
      {
        id: 'audit-initial-2',
        dealId: 'deal-2',
        dealCode: 'PO-2026-002',
        customerName: 'Công ty Cổ phần sữa Việt Nam (Vinamilk)',
        salespersonName: 'Trần Thị Mỹ Linh',
        oldStatus: 'PENDING',
        newStatus: 'APPROVED',
        changedBy: 'Kế toán trưởng',
        timestamp: new Date(Date.now() - 12 * 60 * 65 * 1000).toISOString(),
        amount: 350000000,
        commission: 17500000,
        note: 'Chứng từ PO đối dịch dịch vụ số hóa đạt chuẩn nghiệm thu'
      }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('sales_commission_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Method to create an audit entry
  const addAuditLog = (
    deal: Deal,
    oldStatus: DealStatus | 'NEW',
    newStatus: DealStatus,
    changedBy: string,
    note?: string
  ) => {
    const sp = salespersons.find(s => s.id === deal.salespersonId);
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dealId: deal.id,
      dealCode: deal.code,
      customerName: deal.customerName,
      salespersonName: sp ? sp.name : 'Chưa rõ',
      oldStatus,
      newStatus,
      changedBy: changedBy || 'Kế toán trưởng',
      timestamp: new Date().toISOString(),
      amount: deal.amount,
      commission: deal.amount * deal.commissionRate,
      note: note || 'Cập nhật trạng thái giao dịch'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Triggers automated email preparation and transport simulation
  const triggerNotification = (deal: Deal, oldStatus: DealStatus | 'NEW', newStatus: DealStatus) => {
    if (!autoTrigger) return;
    const sp = salespersons.find(s => s.id === deal.salespersonId);
    if (!sp) return;

    const { subject, bodyText } = generateEmailContent(deal, sp, oldStatus, newStatus);

    const newNotification: EmailNotification = {
      id: `notify-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dealId: deal.id,
      dealCode: deal.code,
      customerName: deal.customerName,
      salespersonId: sp.id,
      salespersonName: sp.name,
      salespersonEmail: sp.email,
      oldStatus,
      newStatus,
      amount: deal.amount,
      commission: deal.amount * deal.commissionRate,
      dateTriggered: new Date().toISOString(),
      subject,
      bodyText,
      sentStatus: 'WAITING'
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Simulate standard SMTP server dispatching over 1.5 seconds!
    setTimeout(() => {
      setNotifications(current => 
        current.map(n => n.id === newNotification.id ? { ...n, sentStatus: 'SUCCESS' } : n)
      );
    }, 1500);
  };

  // Active tab selection
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'deals' | 'team' | 'tax-lookup' | 'notifications' | 'audit-log'>('dashboard');

  // Real-time Vietnamese formatted date display
  const [currentDateString] = React.useState(() => {
    return new Date('2026-06-18T01:13:55-07:00').toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // Reset to default mock records state
  const handleResetData = () => {
    if (confirm('Xác nhận đặt lại toàn bộ cơ sở dữ liệu về mặc định ban đầu? Các thay đổi của bạn sẽ bị ghi đè.')) {
      setSalespersons(INITIAL_SALESPERSONS);
      setDeals(INITIAL_DEALS);
      setNotifications([]);
      setAutoTrigger(true);
      setBccAddress('ban-giam-doc@company.com');
      setIncludePITDetails(true);
      setActiveTab('dashboard');
    }
  };

  // --- CRUD Handlers for Team Members ---
  const handleAddSalesPerson = (newSp: Omit<SalesPerson, 'id'>) => {
    const freshSp: SalesPerson = {
      ...newSp,
      id: `sp-${Date.now()}`
    };
    setSalespersons([...salespersons, freshSp]);
  };

  const handleEditSalesPerson = (updatedSp: SalesPerson) => {
    setSalespersons(salespersons.map(sp => sp.id === updatedSp.id ? updatedSp : sp));
  };

  const handleDeleteSalesPerson = (id: string) => {
    setSalespersons(salespersons.filter(sp => sp.id !== id));
    // Also remove or unlink deals of deleted salesperson
    // Keep them in database but clear agent to prevent breaking UI
    setDeals(deals.filter(deal => deal.salespersonId !== id));
  };

  // --- CRUD Handlers for Deals ---
  const handleAddDeal = (newDeal: Omit<Deal, 'id'>, actingRole?: string, changeNote?: string) => {
    const freshDeal: Deal = {
      ...newDeal,
      id: `deal-${Date.now()}`
    };
    setDeals([...deals, freshDeal]);
    triggerNotification(freshDeal, 'NEW', freshDeal.status);
    addAuditLog(freshDeal, 'NEW', freshDeal.status, actingRole || 'Giám đốc kinh doanh', changeNote || 'Khởi tạo hợp đồng mới trên hệ thống');
  };

  const handleEditDeal = (updatedDeal: Deal, actingRole?: string, changeNote?: string) => {
    const oldDeal = deals.find(d => d.id === updatedDeal.id);
    setDeals(deals.map(deal => deal.id === updatedDeal.id ? updatedDeal : deal));

    if (oldDeal) {
      if (oldDeal.status !== updatedDeal.status) {
        triggerNotification(updatedDeal, oldDeal.status, updatedDeal.status);
        addAuditLog(
          updatedDeal, 
          oldDeal.status, 
          updatedDeal.status, 
          actingRole || 'Ban Giám Đốc', 
          changeNote || `Duyệt thay đổi trạng thái từ ${oldDeal.status} sang ${updatedDeal.status}`
        );
      } else {
        addAuditLog(
          updatedDeal,
          oldDeal.status,
          updatedDeal.status,
          actingRole || 'Kế toán trưởng',
          changeNote || 'Cập nhật nội dung thông tin hợp đồng'
        );
      }
    }
  };

  const handleDeleteDeal = (id: string) => {
    setDeals(deals.filter(deal => deal.id !== id));
  };

  // --- Real-time Stats Aggregation ---
  const financialStats = React.useMemo(() => {
    // 1. Total revenue
    const totalRevenue = deals.reduce((sum, d) => sum + d.amount, 0);

    // 2. Cumulative generated gross commission (5% of PO revenue as specified)
    const grossCommission = deals.reduce((sum, d) => sum + (d.amount * d.commissionRate), 0);

    // 3. Paid vs Pending commissions
    const paidCommission = deals
      .filter(d => d.status === 'PAID')
      .reduce((sum, d) => sum + (d.amount * d.commissionRate), 0);

    const pendingCommission = deals
      .filter(d => d.status === 'PENDING')
      .reduce((sum, d) => sum + (d.amount * d.commissionRate), 0);

    const approvedCommission = deals
      .filter(d => d.status === 'APPROVED')
      .reduce((sum, d) => sum + (d.amount * d.commissionRate), 0);

    // 4. Calculate total Personal Income Tax (PIT) withheld at source for all sales reps
    let totalPITWithheld = 0;
    let totalBaseSalariesDistributed = 0;

    salespersons.forEach(sp => {
      // Find this salesperson's approved or paid deals (which triggers taxable income)
      const personDeals = deals.filter(d => d.salespersonId === sp.id && (d.status === 'APPROVED' || d.status === 'PAID'));
      const approvedCommissionAmt = personDeals.reduce((sum, d) => sum + (d.amount * d.commissionRate), 0);

      if (sp.contractType === 'HD_LAO_DONG') {
        // Progressive formula
        const taxDetails = calculateProgressiveTax(sp.baseSalary, approvedCommissionAmt, sp.dependents);
        totalPITWithheld += taxDetails.totalTax;
        totalBaseSalariesDistributed += sp.baseSalary;
      } else {
        // Casual Freelance: Tax 10% per transaction if commission >= 2M
        personDeals.forEach(deal => {
          const dealComm = deal.amount * deal.commissionRate;
          totalPITWithheld += calculateFreelanceTaxForDeal(dealComm);
        });
      }
    });

    // 5. Total Net distribution to sales team
    // Gross payout = Base salary (for formal) + Gross Commissions
    const totalGrossOutlay = totalBaseSalariesDistributed + grossCommission;
    const totalNetToTeam = totalGrossOutlay - totalPITWithheld;

    return {
      totalRevenue,
      grossCommission,
      paidCommission,
      pendingCommission,
      approvedCommission,
      totalPITWithheld,
      totalBaseSalariesDistributed,
      totalNetToTeam,
      activeTeamCount: salespersons.length,
      dealsCompletedCount: deals.length
    };
  }, [deals, salespersons]);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden" id="app-root">
      {/* Sidebar Left Navigation */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0 text-slate-300 border-r border-slate-800" id="app-sidebar">
        {/* Sidebar Brand Header */}
        <div className="p-4.5 border-b border-slate-800 flex flex-col gap-1 shrink-0 bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-black text-white text-base shadow-sm">
              %
            </div>
            <div>
              <span className="text-white font-black tracking-tight text-xs uppercase block">Quản Lý Hoa Hồng</span>
              <span className="text-[9px] text-slate-400 font-mono font-medium block">PIT TAX SYSTEM v1.0 • DYNAMIC</span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto" id="sidebar-navigation">
          <div className="pb-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2.5">Bảng Điều Khiển</span>
          </div>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-tight transition-all text-left ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>Tổng quan & Báo cáo</span>
          </button>

          <button
            onClick={() => setActiveTab('deals')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-tight transition-all text-left ${
              activeTab === 'deals'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0 text-sky-400" />
            <span>Danh Sách Hợp Đồng & PO</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-tight transition-all text-left ${
              activeTab === 'team'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <Users className="w-4 h-4 shrink-0 text-teal-400" />
            <span>Danh Mục Sales & Định Biên</span>
          </button>

          <button
            onClick={() => setActiveTab('tax-lookup')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-tight transition-all text-left ${
              activeTab === 'tax-lookup'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0 text-pink-400" />
            <span>Tra Cứu & Trực Quan Thuế</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold tracking-tight transition-all text-left ${
              activeTab === 'notifications'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Email & Thông Báo</span>
            </div>
            {notifications.filter(n => n.sentStatus === 'WAITING').length > 0 && (
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit-log')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-tight transition-all text-left ${
              activeTab === 'audit-log'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Nhật Ký Kiểm Toán (Audit Log)</span>
          </button>
        </nav>

        {/* Sidebar Bottom Actions */}
        <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-950 space-y-2.5" id="sidebar-footer">
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 space-y-1">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Trạng thái đồng bộ</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-tight">Thuế Việt Nam 2026</span>
            </div>
          </div>
          <button
            onClick={handleResetData}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-red-950 hover:text-red-200 border border-slate-800 text-slate-400 rounded-lg text-[10px] font-bold transition-all text-center"
            title="Khôi phục dữ liệu ban đầu cho hệ thống"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi Phục Dữ Liệu Gốc
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-100" id="main-content-panel">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0" id="app-header">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black text-slate-850 tracking-tight uppercase">
              {activeTab === 'dashboard' && "Tổng Quan Doanh Thu & Báo Cáo Hoa Hồng Đội Ngũ"}
              {activeTab === 'deals' && "Quản Lý Danh Sách Hợp Đồng & Chứng Từ PO"}
              {activeTab === 'team' && "Nhân Sự Sales & Chính Sách Lương Định Biên"}
              {activeTab === 'tax-lookup' && "Mô Phỏng & Giải Thích Chi Tiết Biểu Thuế TNCN"}
              {activeTab === 'notifications' && "Trung tâm Email & Tự động phát chuyển Thông Báo"}
            </h2>
            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
              REAL-TIME FORMULAS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Lịch làm việc kế toán</p>
              <p className="text-[11px] font-mono font-bold text-slate-700">{currentDateString}</p>
            </div>
          </div>
        </header>

        {/* Scrollable details panel */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4" id="main-scrollable-content">
          
          {/* Core Financial Stat Cards Row */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" id="stats-dashboard-row">
            <StatCard
              id="stat-revenue"
              title="TỔNG DOANH THU (HĐ & PO)"
              value={formatVND(financialStats.totalRevenue)}
              subValue={`Tổng số ${financialStats.dealsCompletedCount} thầu giao dịch`}
              subValueColor="text-slate-500"
              icon={Building}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
            />

            <StatCard
              id="stat-commission"
              title="HOA HỒNG PHÁT SINH"
              value={formatVND(financialStats.grossCommission)}
              subValue={`Chờ duyệt chi: ${formatVND(financialStats.pendingCommission)}`}
              subValueColor="text-amber-600 font-semibold"
              icon={Coins}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-700"
            />

            {/* PIT Withheld High-Contrast standing indicator as required by layout density rules */}
            <div id="stat-tax" className="bg-white rounded-xl p-4.5 shadow-xs border-l-4 border-l-red-500 border border-slate-200/85 flex items-start justify-between hover:shadow-sm transition-all duration-150">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight block">TỔNG THUẾ TNCN KHẨU TRỪ</span>
                <h3 className="text-lg font-black text-red-600 tracking-tight font-mono">{formatVND(financialStats.totalPITWithheld)}</h3>
                <p className="text-[10px] text-red-500 font-semibold">Tự động tạm giữ nộp ngân sách tại nguồn</p>
              </div>
              <div className="p-2.5 rounded-lg bg-red-50 text-red-600 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            <div id="stat-payout" className="bg-white rounded-xl p-4.5 shadow-xs border-l-4 border-l-emerald-500 border border-slate-200/85 flex items-start justify-between hover:shadow-sm transition-all duration-150">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight block">THỰC NHẬN ĐỘI NGŨ SALES</span>
                <h3 className="text-lg font-black text-emerald-700 tracking-tight font-mono">{formatVND(financialStats.totalNetToTeam)}</h3>
                <p className="text-[10px] text-emerald-600 font-semibold">Đã gồm {formatVND(financialStats.totalBaseSalariesDistributed)} lương cứng</p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </section>

          {/* Tab Content Area inside High-Density framed container */}
          <section className="space-y-4" id="active-tab-container-view">
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                {/* Notification Panel regarding Vietnam Tax Regulation compliance */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex gap-3.5 items-start">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-lg shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-tight">Hệ thống khớp luật thuế TNCN hiện hành</h4>
                    <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                      Kế toán và doanh nghiệp tự động giảm trừ rủi ro thanh tra thuế nhờ hai bộ lọc tự động thông minh:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px] text-blue-700 font-medium">
                      <div className="bg-white/60 p-2.5 rounded border border-blue-150/50">
                        <strong className="text-blue-900">1. Lao động trong biên chế (Lao động trực thuộc)</strong>: Áp thuế lũy tiến 7 cấp (5% - 35%) sau khi chiết giảm trừ cá nhân {formatVND(11000000)}, gia cảnh phụ thuộc ({formatVND(4400000)}/người) và BHXH tự nguyện đóng (10.5%).
                      </div>
                      <div className="bg-white/60 p-2.5 rounded border border-blue-150/50">
                        <strong className="text-blue-900">2. Lao động vãng lai / CTV (Casual Contract)</strong>: Trực tiếp trích giữ thu thuế 10% tại nguồn cho tất cả các giao dịch nghiệm thu có giá trị hoa hồng tối thiểu từ 2.000.000 VND trở lên.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytical Charts Block */}
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <AnalyticsCharts deals={deals} salespersons={salespersons} />
                </div>

                {/* Bottom Quick-access info row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 bg-slate-900 text-white rounded-xl p-5 flex items-center justify-between border border-slate-800">
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-sky-450 bg-sky-950 px-2.5 py-0.5 rounded border border-sky-850">Bộ phận Nhân sự & Kế toán</span>
                      <h4 className="text-sm font-black tracking-tight text-white">Tra cứu công thức tính hoặc chứng từ đóng thuế?</h4>
                      <p className="text-xs text-slate-400 max-w-lg leading-relaxed font-mono">
                        Nếu cần phân tích từng khoản khấu trừ bảo hiểm xã hội, mức đóng thuế riêng biệt theo bảng lương để giải trình với cộng tác viên, vui lòng chuyển sang cổng tra cứu thuế chuyên sâu.
                      </p>
                      <button
                        onClick={() => setActiveTab('tax-lookup')}
                        className="mt-2.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg shadow-sm border border-indigo-500 transition-all flex items-center gap-1"
                      >
                        Bấm vào đây để tra cứu chi tiết thuế TNCN
                      </button>
                    </div>
                    <div className="p-3 bg-slate-850 rounded-xl shrink-0 hidden md:block">
                      <Award className="w-12 h-12 text-amber-500" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center justify-between">
                        <span>TÓM TẮT TRẠNG THÁI HOA HỒNG</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 rounded">Tự động</span>
                      </h5>
                      <div className="space-y-2.5 mt-2.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">Đã chi trả:</span>
                          <span className="text-emerald-700 font-mono font-bold">{formatVND(financialStats.paidCommission)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">Đã duyệt (Chờ chi):</span>
                          <span className="text-blue-700 font-mono font-bold">{formatVND(financialStats.approvedCommission)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">Đang chờ xử lý:</span>
                          <span className="text-amber-700 font-mono font-bold">{formatVND(financialStats.pendingCommission)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('deals')}
                      className="w-full text-center py-1.5 mt-3 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 font-bold text-[10px] rounded-lg transition-all uppercase tracking-tight"
                    >
                      Kiểm Tra Sổ Hợp Đồng
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="bg-white rounded-xl p-1 border border-slate-200">
                <DealList
                  deals={deals}
                  salespersons={salespersons}
                  onAddDeal={handleAddDeal}
                  onEditDeal={handleEditDeal}
                  onDeleteDeal={handleDeleteDeal}
                />
              </div>
            )}

            {activeTab === 'team' && (
              <div className="bg-white rounded-xl p-1 border border-slate-200">
                <SalesPersonList
                  salespersons={salespersons}
                  deals={deals}
                  onAddSalesPerson={handleAddSalesPerson}
                  onEditSalesPerson={handleEditSalesPerson}
                  onDeleteSalesPerson={handleDeleteSalesPerson}
                />
              </div>
            )}

            {activeTab === 'tax-lookup' && (
              <div className="bg-white rounded-xl p-1 border border-slate-200">
                <TaxCalculatorView 
                  salespersons={salespersons} 
                  deals={deals} 
                />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <NotificationCenter
                  notifications={notifications}
                  setNotifications={setNotifications}
                  salespersons={salespersons}
                  autoTrigger={autoTrigger}
                  setAutoTrigger={setAutoTrigger}
                  bccAddress={bccAddress}
                  setBccAddress={setBccAddress}
                  includePITDetails={includePITDetails}
                  setIncludePITDetails={setIncludePITDetails}
                />
              </div>
            )}

            {activeTab === 'audit-log' && (
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <AuditLogView
                  logs={auditLogs}
                  onClearLogs={() => setAuditLogs([])}
                />
              </div>
            )}
          </section>

          {/* Footer block embedded cleanly inside the content feed */}
          <footer className="pt-10 pb-6 text-center text-slate-400 text-[10px] border-t border-slate-200/60 max-w-7xl mx-auto space-y-1">
            <p className="font-bold text-slate-600 uppercase tracking-wider">Hệ Thống Quản Lý Hoa Hồng Trực Tuyến v1.0.0</p>
            <p>Hệ thống tự động đồng bộ thuế PIT & dòng tiền hoa hồng linh hoạt trên thầu PO • Được kiểm toán theo quy định nhà nước.</p>
            <p className="text-[9px] text-slate-400">Bảo lưu mọi quyền © 2026 • Trình bày theo chuẩn thiết kế High Density có mật độ hiển thị thông tin tối ưu.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
