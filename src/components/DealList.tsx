import React from 'react';
import { Deal, SalesPerson, DealStatus } from '../types';
import { formatVND } from '../taxUtils';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  Building,
  DollarSign,
  Percent,
  X,
  Filter,
  FileCheck,
  Calendar,
  UserCheck
} from 'lucide-react';

interface DealListProps {
  deals: Deal[];
  salespersons: SalesPerson[];
  onAddDeal: (deal: Omit<Deal, 'id'>, actingRole: string, changeNote: string) => void;
  onEditDeal: (deal: Deal, actingRole: string, changeNote: string) => void;
  onDeleteDeal: (id: string) => void;
}

export const DealList: React.FC<DealListProps> = ({
  deals,
  salespersons,
  onAddDeal,
  onEditDeal,
  onDeleteDeal
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [salespersonFilter, setSalespersonFilter] = React.useState<string>('ALL');
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingDeal, setEditingDeal] = React.useState<Deal | null>(null);

  // Form states
  const [code, setCode] = React.useState('');
  const [customerName, setCustomerName] = React.useState('');
  const [assignedSpId, setAssignedSpId] = React.useState('');
  const [amount, setAmount] = React.useState(100000000); // 100,000,000 VND default
  const [commissionRate, setCommissionRate] = React.useState(5); // default to 5%
  const [status, setStatus] = React.useState<DealStatus>('PENDING');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = React.useState('');

  // Audit Log details inside form
  const [actingRole, setActingRole] = React.useState('Kế toán trưởng');
  const [changeNote, setChangeNote] = React.useState('');

  // States for Quick Status Transition Modal
  const [quickTransitionDeal, setQuickTransitionDeal] = React.useState<Deal | null>(null);
  const [quickTargetStatus, setQuickTargetStatus] = React.useState<DealStatus | null>(null);
  const [quickActor, setQuickActor] = React.useState('Kế toán trưởng');
  const [quickNote, setQuickNote] = React.useState('');
  const [isQuickOpen, setIsQuickOpen] = React.useState(false);

  const handleQuickTransition = (deal: Deal, target: DealStatus) => {
    setQuickTransitionDeal(deal);
    setQuickTargetStatus(target);
    setQuickActor('Kế toán trưởng');
    setQuickNote(target === 'APPROVED' ? 'Phê duyệt nhanh hoa hồng - Chứng từ PO hợp lệ' : 'Xác nhận kế toán đã chi trả hoa hồng thành công');
    setIsQuickOpen(true);
  };

  const submitQuickTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTransitionDeal || !quickTargetStatus) return;
    onEditDeal({
      ...quickTransitionDeal,
      status: quickTargetStatus,
    }, quickActor, quickNote);
    setIsQuickOpen(false);
    setQuickTransitionDeal(null);
    setQuickTargetStatus(null);
  };


  // Auto populate salesperson on load
  React.useEffect(() => {
    if (salespersons.length > 0 && !assignedSpId) {
      setAssignedSpId(salespersons[0].id);
    }
  }, [salespersons, assignedSpId]);

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingDeal(null);
    setCode(`HD-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 105)}`);
    setCustomerName('');
    setAssignedSpId(salespersons[0]?.id || '');
    setAmount(100000000);
    setCommissionRate(5); // Default to 5%
    setStatus('PENDING');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setActingRole('Kế toán trưởng');
    setChangeNote('Khởi tạo hợp đồng mới trên hệ thống');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setCode(deal.code);
    setCustomerName(deal.customerName);
    setAssignedSpId(deal.salespersonId);
    setAmount(deal.amount);
    setCommissionRate(deal.commissionRate * 100);
    setStatus(deal.status);
    setDate(deal.date);
    setNote(deal.note || '');
    setActingRole('Kế toán trưởng');
    setChangeNote(deal.status !== 'PENDING' ? `Cập nhật thông tin chi tiết hợp đồng` : 'Khảo sát thực thi chứng từ nghiệm thu');
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingDeal(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !customerName.trim() || !assignedSpId) return;

    if (editingDeal) {
      onEditDeal({
        ...editingDeal,
        code,
        customerName,
        salespersonId: assignedSpId,
        amount: Number(amount),
        commissionRate: Number(commissionRate) / 100,
        status,
        date,
        note,
      }, actingRole, changeNote || 'Cập nhật trạng thái giao dịch');
    } else {
      onAddDeal({
        code,
        customerName,
        salespersonId: assignedSpId,
        amount: Number(amount),
        commissionRate: Number(commissionRate) / 100,
        status,
        date,
        note,
      }, actingRole, changeNote || 'Khởi tạo ghi nhận doanh thu mới');
    }
    handleClose();
  };

  // Filter deals
  const filteredDeals = React.useMemo(() => {
    return deals.filter(deal => {
      const spName = salespersons.find(sp => sp.id === deal.salespersonId)?.name || '';
      const textMatch = 
        deal.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === 'ALL' || deal.status === statusFilter;
      const spMatch = salespersonFilter === 'ALL' || deal.salespersonId === salespersonFilter;

      // Date match
      let dateMatch = true;
      if (startDate) {
        dateMatch = dateMatch && (deal.date >= startDate);
      }
      if (endDate) {
        dateMatch = dateMatch && (deal.date <= endDate);
      }

      return textMatch && statusMatch && spMatch && dateMatch;
    });
  }, [deals, salespersons, searchTerm, statusFilter, salespersonFilter, startDate, endDate]);

  // Compute status counts for live search/filter badges
  const statusCounts = React.useMemo(() => {
    const counts = {
      ALL: deals.length,
      PENDING: 0,
      APPROVED: 0,
      PAID: 0
    };
    deals.forEach(deal => {
      if (deal.status === 'PENDING') counts.PENDING++;
      if (deal.status === 'APPROVED') counts.APPROVED++;
      if (deal.status === 'PAID') counts.PAID++;
    });
    return counts;
  }, [deals]);

  // Helper for fast date ranges
  const setDatePreset = (preset: 'ALL' | 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR') => {
    const today = new Date('2026-06-18'); // Reference active year/month
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'THIS_MONTH') {
      const year = today.getFullYear();
      const month = today.getMonth(); // 0-indexed
      const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'THIS_QUARTER') {
      const year = today.getFullYear();
      const month = today.getMonth();
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const start = `${year}-${String(quarterStartMonth + 1).padStart(2, '0')}-01`;
      const quarterEndMonth = quarterStartMonth + 2;
      const lastDay = new Date(year, quarterEndMonth + 1, 0).getDate();
      const end = `${year}-${String(quarterEndMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'THIS_YEAR') {
      const year = today.getFullYear();
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
    }
  };

  // Helper for salesperson name
  const getSalespersonName = (id: string) => {
    return salespersons.find(s => s.id === id)?.name || 'Không xác định';
  };

  // Quick commission preview calculated at custom commission rate
  const previewCommission = Number(amount) * (Number(commissionRate) / 100);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6" id="deals-database-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
            <FileText className="w-5 h-5 text-indigo-500" />
            Cơ Sở Dữ Liệu Hợp Đồng & PO Phát Sinh
          </h4>
          <p className="text-xs text-slate-500">
            Tự động áp dụng công thức hoa hồng linh hoạt theo Tỷ lệ từng hợp đồng, quản lý chi tiết tiền nghiệm thu và PIT tương ứng
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          disabled={salespersons.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo Hợp Đồng / PO
        </button>
      </div>

      {/* Filters Area */}
      <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-xl space-y-4">
        {/* Row 1: Search, Salesperson & Dates */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Real-time search with instant-clear */}
          <div className="lg:col-span-4 space-y-1">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Từ khóa tìm kiếm</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Mã HĐ, Khách hàng, Tên Sale..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-250 text-slate-800 text-xs rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5 bg-slate-100 hover:bg-slate-250 rounded-full p-0.5" />
                </button>
              )}
            </div>
          </div>

          {/* Salesperson Filter */}
          <div className="lg:col-span-3 space-y-1">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Nhân sự phụ trách</span>
            <select
              value={salespersonFilter}
              onChange={(e) => setSalespersonFilter(e.target.value)}
              className="w-full bg-white border border-slate-250 text-slate-850 text-xs rounded-lg p-2 outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">👤 Tất cả Sales</option>
              {salespersons.map(s => (
                <option key={s.id} value={s.id}>👤 {s.name} ({s.department === 'OFFICIAL' ? 'Chính thức' : 'Cộng tác viên'})</option>
              ))}
            </select>
          </div>

          {/* Date Range Fields */}
          <div className="lg:col-span-5 space-y-1">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Khoảng thời gian (Ngày hiệu lực)</span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-250 text-slate-800 text-[11px] rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <span className="text-slate-400 text-xs font-bold font-mono">→</span>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-250 text-slate-800 text-[11px] rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="p-1 px-2 border border-slate-200 bg-white hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors shrink-0 text-[10px] font-bold"
                  title="Xóa khoảng thời gian"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Status Chips & Date Range Shortcuts */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-slate-200/50 pt-3">
          {/* Dynamic Interactive Status Filters with Badge Counts */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">Lọc nhanh theo Trạng thái duyệt chi</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 border border-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-250 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Tất cả</span>
                <span className={`text-[9px] px-1.5 py-0.25 rounded-md font-mono ${statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {statusCounts.ALL}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold border transition-all flex items-center gap-1.5 ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-xs'
                    : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-550 shrink-0"></div>
                <span>Chờ duyệt chi</span>
                <span className={`text-[9px] px-1.5 py-0.25 rounded-md font-mono ${statusFilter === 'PENDING' ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>
                  {statusCounts.PENDING}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold border transition-all flex items-center gap-1.5 ${
                  statusFilter === 'APPROVED'
                    ? 'bg-blue-100 border-blue-300 text-blue-800 shadow-xs'
                    : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></div>
                <span>Đã duyệt (Chờ chi)</span>
                <span className={`text-[9px] px-1.5 py-0.25 rounded-md font-mono ${statusFilter === 'APPROVED' ? 'bg-blue-200/70 text-blue-900' : 'bg-slate-100 text-slate-500'}`}>
                  {statusCounts.APPROVED}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PAID')}
                className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold border transition-all flex items-center gap-1.5 ${
                  statusFilter === 'PAID'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></div>
                <span>Đã chi trả</span>
                <span className={`text-[9px] px-1.5 py-0.25 rounded-md font-mono ${statusFilter === 'PAID' ? 'bg-emerald-200/75 text-emerald-900' : 'bg-slate-100 text-slate-500'}`}>
                  {statusCounts.PAID}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="space-y-1 sm:text-right shrink-0">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">Bộ lọc nhanh thời gian</span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setDatePreset('ALL')}
                className="px-2.5 py-1.5 bg-white border border-slate-250 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg transition-all"
              >
                Toàn bộ
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('THIS_MONTH')}
                className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition-all"
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('THIS_QUARTER')}
                className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition-all"
              >
                Quý này
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('THIS_YEAR')}
                className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition-all"
              >
                Năm 2026
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <div className="overflow-x-auto border border-slate-150 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-bold">
              <th className="py-3 px-4">Mã HĐ / PO</th>
              <th className="py-3 px-4">Thông tin hợp đồng & Ghi chú</th>
              <th className="py-3 px-4">Nhân sự phụ trách</th>
              <th className="py-3 px-4 text-right">Doanh thu PO</th>
              <th className="py-3 px-4 text-center">Tỷ lệ</th>
              <th className="py-3 px-4 text-right">Hoa hồng phát sinh</th>
              <th className="py-3 px-4 text-center">Trạng thái phát sinh</th>
              <th className="py-3 px-4 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredDeals.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-medium italic">
                  Chưa ghi nhận hợp đồng hoặc điều kiện lọc không có kết quả hợp lệ.
                </td>
              </tr>
            ) : (
              filteredDeals.map(deal => {
                const commission = deal.amount * deal.commissionRate;
                const sp = salespersons.find(s => s.id === deal.salespersonId);
                return (
                  <tr key={deal.id} className="hover:bg-slate-50/45 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {deal.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        <p className="font-bold text-slate-800 text-sm">{deal.customerName}</p>
                        {deal.note && <p className="text-[10px] text-slate-400 truncate" title={deal.note}>{deal.note}</p>}
                        <p className="text-[10px] text-slate-400">Ngày ký: {deal.date}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <span>{getSalespersonName(deal.salespersonId)}</span>
                          {sp && (
                            <span className="block text-[9px] text-slate-400">
                              ({sp.contractType === 'HD_LAO_DONG' ? 'HĐ Lao Động' : 'Vãng lai'})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-750">
                      {formatVND(deal.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        {(deal.commissionRate * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-600 bg-emerald-50/15">
                      {formatVND(commission)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        deal.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : deal.status === 'APPROVED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {deal.status === 'PAID' ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Đã chi trả & khấu trừ
                          </>
                        ) : deal.status === 'APPROVED' ? (
                          <>
                            <FileCheck className="w-3.5 h-3.5" /> Đã duyệt (Tích hợp PIT)
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" /> Chờ duyệt nghiệm thu
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {deal.status === 'PENDING' && (
                          <button
                            onClick={() => handleQuickTransition(deal, 'APPROVED')}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-750 border border-blue-250 rounded text-[10px] font-extrabold tracking-tight transition-all flex items-center gap-0.5"
                            title="Phê duyệt nhanh"
                          >
                            <FileCheck className="w-3.5 h-3.5" /> Duyệt chi
                          </button>
                        )}
                        {deal.status === 'APPROVED' && (
                          <button
                            onClick={() => handleQuickTransition(deal, 'PAID')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-750 border border-emerald-250 rounded text-[10px] font-extrabold tracking-tight transition-all flex items-center gap-0.5"
                            title="Xác nhận chi trả"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Chi trả
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(deal)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Sửa hợp đồng"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Xác nhận xóa Hợp đồng/PO mã "${deal.code}"?`)) {
                              onDeleteDeal(deal.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Xóa hợp đồng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal addition or editing */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-150 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide">
                  {editingDeal ? 'Cập Nhật Hợp Đồng / PO' : 'Ghi Nhận Hợp Đồng Phát Sinh Mới'}
                </h4>
                <p className="text-[10px] text-slate-400">Thiết lập doanh thu, tỷ lệ hoa hồng linh hoạt và người phụ trách tương ứng</p>
              </div>
              <button 
                onClick={handleClose} 
                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Code and Customer */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 space-y-1">
                    <label htmlFor="deal-code" className="text-xs font-bold text-slate-700 block">Mã HĐ / PO <span className="text-red-500">*</span></label>
                    <input
                      id="deal-code"
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="HD-2026-xxx"
                      className="w-full text-xs font-mono font-medium text-slate-800 border border-slate-350 p-2.5 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label htmlFor="customer-name" className="text-xs font-bold text-slate-700 block">Tên Khách Hàng / Đối tác <span className="text-red-500">*</span></label>
                    <input
                      id="customer-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="VD: Công ty Cổ phần Vinamilk Việt Nam"
                      className="w-full text-xs font-medium text-slate-800 border border-slate-350 p-2.5 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Salesperson Assignment */}
                <div className="space-y-1">
                  <label htmlFor="assigned-salesperson" className="text-xs font-bold text-slate-700 block">Nhân viên Sale phụ trách <span className="text-red-500">*</span></label>
                  <select
                    id="assigned-salesperson"
                    required
                    value={assignedSpId}
                    onChange={(e) => setAssignedSpId(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 border border-slate-350 p-2.5 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>-- Chọn Nhân Viên --</option>
                    {salespersons.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.contractType === 'HD_LAO_DONG' ? 'LĐ: lũy tiến' : 'Casual: vãng lai 10%'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount and Commission Rate in a grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label htmlFor="deal-amount" className="text-xs font-bold text-slate-700 block">Doanh Thu Ghi Nhận (VND) <span className="text-red-500">*</span></label>
                    <input
                      id="deal-amount"
                      type="number"
                      min={0}
                      required
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full text-xs font-mono font-medium text-slate-850 border border-slate-350 p-2.5 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label htmlFor="deal-commission-rate" className="text-xs font-bold text-slate-700 block">Tỷ lệ Hoa hồng (%) <span className="text-red-500">*</span></label>
                    <input
                      id="deal-commission-rate"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      required
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="w-full text-xs font-mono font-medium text-slate-850 border border-slate-350 p-2.5 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Automatic dynamic commission math showcase */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex justify-between items-center text-xs">
                  <span className="text-slate-550 font-medium">Hoa hồng của đội ngũ Sales ({commissionRate}%):</span>
                  <span className="font-bold text-emerald-700 font-mono text-sm">
                    {formatVND(previewCommission)}
                  </span>
                </div>

                {/* Status and Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="deal-status" className="text-xs font-bold text-slate-700 block">Trạng thái duyệt chi</label>
                    <select
                      id="deal-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as DealStatus)}
                      className="w-full text-xs font-medium text-slate-800 border border-slate-350 p-2.5 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="PENDING">Chờ duyệt chi hoa hồng</option>
                      <option value="APPROVED">Đã duyệt (Ghi nhận tính thuế)</option>
                      <option value="PAID">Đã chi trả & Hoàn thành khấu trừ</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="deal-date" className="text-xs font-bold text-slate-700 block">Ngày giao dịch PO</label>
                    <input
                      id="deal-date"
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-xs font-medium text-slate-800 border border-slate-350 p-2.5 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label htmlFor="deal-note" className="text-xs font-bold text-slate-700 block">Ghi chú hợp đồng</label>
                  <textarea
                    id="deal-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập ghi chú quan trọng hoặc cấu trúc nghiệm thu..."
                    rows={2}
                    className="w-full text-xs font-medium text-slate-800 border border-slate-350 p-2.5 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Audit log details mapping */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3">
                  <h5 className="text-[11px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-indigo-650" />
                    Thông Tin Kiểm Toán & Phê Duyệt Trạng Thái
                  </h5>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label htmlFor="acting-role" className="text-[10px] uppercase font-black tracking-wider text-slate-500">Người thực hiện duyệt <span className="text-red-500">*</span></label>
                      <select
                        id="acting-role"
                        value={actingRole}
                        onChange={(e) => setActingRole(e.target.value)}
                        className="w-full text-xs font-bold text-slate-800 border border-slate-300 p-2 rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                        <option value="Kế toán trưởng">Kế toán trưởng</option>
                        <option value="Giám đốc tài chính (CFO)">Giám đốc tài chính (CFO)</option>
                        <option value="Quản trị viên">Quản trị viên</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="change-note" className="text-[10px] uppercase font-black tracking-wider text-slate-500 font-sans">Lý do thay đổi trạng thái</label>
                      <input
                        id="change-note"
                        type="text"
                        value={changeNote}
                        onChange={(e) => setChangeNote(e.target.value)}
                        placeholder="Nội dung duyệt chi, đối soát..."
                        className="w-full text-xs font-medium text-slate-800 border border-slate-300 p-2 rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-750 rounded-xl shadow-xs transition-all"
                >
                  {editingDeal ? 'Cập Nhật' : 'Tạo Giao Dịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Approval / Transition Audit Modal Popup */}
      {isQuickOpen && quickTransitionDeal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs w-full h-full">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-150 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  XÁC NHẬN PHÊ DUYỆT NHANH (AUDIT ON-THE-FLY)
                </h4>
                <p className="text-[10px] text-slate-400">Ghi nhận tức thời hành động của thành viên kế toán vào hệ thống lưu vết</p>
              </div>
              <button 
                onClick={() => setIsQuickOpen(false)} 
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitQuickTransition} className="p-5 space-y-4">
              <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 text-xs space-y-1.5 text-slate-700">
                <p>Hợp đồng: <strong className="text-slate-900">{quickTransitionDeal.code}</strong> ({quickTransitionDeal.customerName})</p>
                <p>Doanh thu: <span className="font-mono font-bold text-slate-900">{formatVND(quickTransitionDeal.amount)}</span></p>
                <p>Hoa hồng phát sinh: <span className="font-mono font-bold text-emerald-600">{formatVND(quickTransitionDeal.amount * quickTransitionDeal.commissionRate)}</span></p>
                <div className="pt-1.5 border-t border-indigo-100 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Chuyển đổi:</span>
                  <span className="text-[10.5px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    {quickTransitionDeal.status}
                  </span>
                  <span className="text-slate-400 font-bold">→</span>
                  <span className="text-[10.5px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-250">
                    {quickTargetStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Vai trò phê duyệt <span className="text-red-500">*</span></label>
                  <select
                    value={quickActor}
                    onChange={(e) => setQuickActor(e.target.value)}
                    className="w-full text-xs font-bold text-slate-850 border border-slate-300 p-2 rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                    <option value="Kế toán trưởng">Kế toán trưởng</option>
                    <option value="Giám đốc tài chính (CFO)">Giám đốc tài chính (CFO)</option>
                    <option value="Quản trị viên">Quản trị viên</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Ghi chú đối soát kiểm toán <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="Lý do hoặc chỉ định của ban lãnh đạo..."
                    rows={2}
                    className="w-full text-xs font-medium text-slate-850 border border-slate-300 p-2 rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all"
                >
                  Xác Nhận & Ghi Sổ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
