import React from 'react';
import { SalesPerson, Deal } from '../types';
import { calculateProgressiveTax, calculateFreelanceTaxForDeal, formatVND } from '../taxUtils';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit, 
  Mail, 
  Phone, 
  Briefcase, 
  UserCheck, 
  DollarSign, 
  Calendar,
  X,
  FileCheck
} from 'lucide-react';

interface SalesPersonListProps {
  salespersons: SalesPerson[];
  deals: Deal[];
  onAddSalesPerson: (sp: Omit<SalesPerson, 'id'>) => void;
  onEditSalesPerson: (sp: SalesPerson) => void;
  onDeleteSalesPerson: (id: string) => void;
}

export const SalesPersonList: React.FC<SalesPersonListProps> = ({
  salespersons,
  deals,
  onAddSalesPerson,
  onEditSalesPerson,
  onDeleteSalesPerson
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSp, setEditingSp] = React.useState<SalesPerson | null>(null);

  // Form states
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [contractType, setContractType] = React.useState<'HD_LAO_DONG' | 'V_LAI'>('HD_LAO_DONG');
  const [baseSalary, setBaseSalary] = React.useState(10000000);
  const [dependents, setDependents] = React.useState(0);
  const [joinDate, setJoinDate] = React.useState(new Date().toISOString().split('T')[0]);

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingSp(null);
    setName('');
    setEmail('');
    setPhone('');
    setContractType('HD_LAO_DONG');
    setBaseSalary(10000000);
    setDependents(0);
    setJoinDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (sp: SalesPerson) => {
    setEditingSp(sp);
    setName(sp.name);
    setEmail(sp.email);
    setPhone(sp.phone);
    setContractType(sp.contractType);
    setBaseSalary(sp.baseSalary);
    setDependents(sp.dependents);
    setJoinDate(sp.joinDate);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingSp(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSp) {
      onEditSalesPerson({
        ...editingSp,
        name,
        email,
        phone,
        contractType,
        baseSalary: contractType === 'V_LAI' ? 0 : Number(baseSalary),
        dependents: contractType === 'V_LAI' ? 0 : Number(dependents),
        joinDate,
      });
    } else {
      onAddSalesPerson({
        name,
        email,
        phone,
        contractType,
        baseSalary: contractType === 'V_LAI' ? 0 : Number(baseSalary),
        dependents: contractType === 'V_LAI' ? 0 : Number(dependents),
        joinDate,
      });
    }
    handleClose();
  };

  // Filter list
  const filteredSalespersons = React.useMemo(() => {
    return salespersons.filter(sp => {
      const nameMatch = sp.name.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = sp.email.toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = sp.phone.includes(searchTerm);
      return nameMatch || emailMatch || phoneMatch;
    });
  }, [salespersons, searchTerm]);

  // Compute stats for each salesperson
  const getPersonPerformance = React.useCallback((spId: string, contractType: 'HD_LAO_DONG' | 'V_LAI', baseSalaryVal: number, dependentsVal: number) => {
    const personDeals = deals.filter(d => d.salespersonId === spId);
    const totalDealsAmount = personDeals.reduce((sum, d) => sum + d.amount, 0);

    // Active approved + paid commission
    const totalCommission = personDeals
      .filter(d => d.status === 'APPROVED' || d.status === 'PAID')
      .reduce((sum, d) => sum + (d.amount * d.commissionRate), 0);

    let pitTax = 0;
    if (contractType === 'HD_LAO_DONG') {
      const calculation = calculateProgressiveTax(baseSalaryVal, totalCommission, dependentsVal);
      pitTax = calculation.totalTax;
    } else {
      // Per deal freelance tax >= 2M commission
      personDeals
        .filter(d => d.status === 'APPROVED' || d.status === 'PAID')
        .forEach(deal => {
          const dealComm = deal.amount * deal.commissionRate;
          pitTax += calculateFreelanceTaxForDeal(dealComm);
        });
    }

    const netResult = (contractType === 'HD_LAO_DONG' ? (baseSalaryVal + totalCommission) : totalCommission) - pitTax;

    return {
      totalDealsAmount,
      totalCommission,
      pitTax,
      netResult
    };
  }, [deals]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6" id="team-list-section">
      {/* List Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
            <Users className="w-5 h-5 text-indigo-500" />
            Đội Ngũ Nhân Viên Kinh Doanh ({salespersons.length})
          </h4>
          <p className="text-xs text-slate-500">Quản lý định biên nhân sự, cấu trúc lương cơ bản và người phụ thuộc để tính thuế</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Thêm Nhân Viên
        </button>
      </div>

      {/* Filter and Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Tìm theo tên, email, số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-50/70 border border-slate-200 text-slate-800 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
        />
      </div>

      {/* Salespersons Table */}
      <div className="overflow-x-auto border border-slate-150 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-bold">
              <th className="py-3 px-4">Nhân sự</th>
              <th className="py-3 px-4">Hợp đồng & Lương</th>
              <th className="py-3 px-4 text-center">Người phụ thuộc</th>
              <th className="py-3 px-4 text-right">Doanh số đem về</th>
              <th className="py-3 px-4 text-right">Hoa hồng phát sinh</th>
              <th className="py-3 px-4 text-right">Thuế TNCN trích</th>
              <th className="py-3 px-4 text-right">Thực nhận</th>
              <th className="py-3 px-4 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredSalespersons.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-medium italic">
                  Không tìm thấy nhân viên nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredSalespersons.map(sp => {
                const perf = getPersonPerformance(sp.id, sp.contractType, sp.baseSalary, sp.dependents);
                return (
                  <tr key={sp.id} className="hover:bg-slate-50/45 transition-colors">
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 text-sm">{sp.name}</p>
                        <div className="flex flex-col gap-0.5 text-[10px] text-slate-450">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {sp.email}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {sp.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className={`inline-block px-1.5 py-0.5 text-[10px] rounded-full font-semibold ${
                          sp.contractType === 'HD_LAO_DONG' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {sp.contractType === 'HD_LAO_DONG' ? 'Chính thức' : 'Vãng lai'}
                        </span>
                        {sp.contractType === 'HD_LAO_DONG' && (
                          <p className="font-medium text-slate-750">Lương: <span className="font-mono">{formatVND(sp.baseSalary)}</span></p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-slate-800 font-semibold font-mono">
                        {sp.contractType === 'HD_LAO_DONG' ? `${sp.dependents}` : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                      {formatVND(perf.totalDealsAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      {formatVND(perf.totalCommission)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-red-600">
                      {perf.pitTax > 0 ? formatVND(perf.pitTax) : '0 ₫'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 bg-slate-50/30">
                      {formatVND(perf.netResult)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(sp)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Sửa thông tin"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc chắn muốn xóa nhân sự "${sp.name}" không? Toàn bộ hợp đồng/PO của nhân chuyển giao sẽ cần phân bổ lại.`)) {
                              onDeleteSalesPerson(sp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Xóa nhân sự"
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
                  {editingSp ? 'Cập Nhật Thông Tin Nhân Sự' : 'Thêm Nhân Viên Kinh Doanh'}
                </h4>
                <p className="text-[10px] text-slate-400">Thiết lập hợp đồng và giảm trừ gia cảnh thuế phù hợp</p>
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
                {/* Name field */}
                <div className="space-y-1">
                  <label htmlFor="name-input" className="text-xs font-bold text-slate-700 block">Họ và Tên <span className="text-red-500">*</span></label>
                  <input
                    id="name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Minh"
                    className="w-full text-xs font-medium text-slate-800 border border-slate-350 p-2.5 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="email-input" className="text-xs font-bold text-slate-700 block">Email</label>
                    <input
                      id="email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="minh.nguyen@company.com"
                      className="w-full text-xs font-medium text-slate-800 border border-slate-350 p-2.5 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="phone-input" className="text-xs font-bold text-slate-700 block">Số điện thoại</label>
                    <input
                      id="phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full text-xs font-medium text-slate-800 border border-slate-350 p-2.5 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Contract Type Selection */}
                <div className="space-y-1">
                  <label htmlFor="contract-selector" className="text-xs font-bold text-slate-700 block">Loại hợp đồng ký kết <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3" id="contract-selector">
                    <label className={`border rounded-xl p-3 flex flex-col gap-0.5 cursor-pointer hover:bg-slate-50 transition-all ${
                      contractType === 'HD_LAO_DONG' 
                        ? 'border-indigo-500 bg-indigo-50/15' 
                        : 'border-slate-200 bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="contractType"
                        checked={contractType === 'HD_LAO_DONG'}
                        onChange={() => setContractType('HD_LAO_DONG')}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold text-slate-850 flex items-center gap-1">
                        <FileCheck className="w-4 h-4 text-blue-500" />
                        HĐ Lao Động
                      </span>
                      <span className="text-[10px] text-slate-450">Tính thuế lũy tiến từng bậc, có giảm trừ gia cảnh</span>
                    </label>

                    <label className={`border rounded-xl p-3 flex flex-col gap-0.5 cursor-pointer hover:bg-slate-50 transition-all ${
                      contractType === 'V_LAI' 
                        ? 'border-indigo-500 bg-indigo-50/15' 
                        : 'border-slate-200 bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="contractType"
                        checked={contractType === 'V_LAI'}
                        onChange={() => setContractType('V_LAI')}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold text-slate-850 flex items-center gap-1">
                        <Briefcase className="w-4 h-4 text-amber-500" />
                        Vãng lai (Casual)
                      </span>
                      <span className="text-[10px] text-slate-450">Khấu trừ flat 10% cho các khoản hoa hồng từ 2M trở lên</span>
                    </label>
                  </div>
                </div>

                {/* Conditional Fields: Base Salary & Dependents (only for HD_LAO_DONG) */}
                {contractType === 'HD_LAO_DONG' && (
                  <div className="grid grid-cols-2 gap-4 border border-indigo-50 bg-indigo-50/5 p-4 rounded-xl animate-in slide-in-from-top-2 duration-155">
                    <div className="space-y-1">
                      <label htmlFor="baseSalary-input" className="text-xs font-bold text-slate-700 block">Lương cơ bản (VND)</label>
                      <input
                        id="baseSalary-input"
                        type="number"
                        min={0}
                        value={baseSalary}
                        onChange={(e) => setBaseSalary(Number(e.target.value))}
                        className="w-full text-xs font-mono font-medium text-slate-850 border border-slate-350 p-2 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[10px] text-slate-450">Làm gốc đóng BHXH & tính giảm trừ gia cảnh</p>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="dependents-input" className="text-xs font-bold text-slate-700 block">Mức người phụ thuộc</label>
                      <input
                        id="dependents-input"
                        type="number"
                        min={0}
                        value={dependents}
                        onChange={(e) => setDependents(Number(e.target.value))}
                        className="w-full text-xs font-mono font-medium text-slate-850 border border-slate-350 p-2 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[10px] text-slate-450">Giảm trừ thêm {formatVND(4400000)} / người</p>
                    </div>
                  </div>
                )}

                {/* Join Date */}
                <div className="space-y-1">
                  <label htmlFor="joinDate-input" className="text-xs font-bold text-slate-700 block">Ngày gia nhập</label>
                  <input
                    id="joinDate-input"
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 border border-slate-350 p-2.5 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
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
                  {editingSp ? 'Lưu Thay Đổi' : 'Tạo Nhân Sự'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
