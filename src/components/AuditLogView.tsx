import React from 'react';
import { 
  ClipboardList, 
  Search, 
  Trash2, 
  Inbox, 
  User, 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  FileCheck, 
  FileText,
  Filter,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';
import { AuditLog, DealStatus } from '../types';
import { formatVND } from '../taxUtils';

interface AuditLogViewProps {
  logs: AuditLog[];
  onClearLogs: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  onClearLogs
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [actorFilter, setActorFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  // Group unique actors for filtering
  const uniqueActors = React.useMemo(() => {
    const actors = new Set<string>();
    logs.forEach(log => {
      if (log.changedBy) actors.add(log.changedBy);
    });
    return Array.from(actors);
  }, [logs]);

  // Filter logs logic
  const filteredLogs = React.useMemo(() => {
    return logs.filter(log => {
      const matchText = 
        log.dealCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.salespersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.note && log.note.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchActor = actorFilter === 'ALL' || log.changedBy === actorFilter;
      const matchStatus = statusFilter === 'ALL' || log.newStatus === statusFilter || log.oldStatus === statusFilter;

      return matchText && matchActor && matchStatus;
    });
  }, [logs, searchTerm, actorFilter, statusFilter]);

  const getStatusBadge = (status: DealStatus | 'NEW') => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-bold">
            <PlusIcon /> Tạo Mới
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-750 border border-amber-100 px-2 py-0.5 rounded-full font-bold">
            <Clock className="w-3 h-3" /> Chờ duyện
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-750 border border-blue-100 px-2 py-0.5 rounded-full font-bold">
            <FileCheck className="w-3 h-3" /> Đã duyệt
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-750 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
            <CheckCircle className="w-3 h-3" /> Đã chi trả
          </span>
        );
      default:
        return <span className="text-xs font-mono">{status}</span>;
    }
  };

  const getActorColor = (actor: string) => {
    switch (actor) {
      case 'Ban Giám Đốc':
        return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Kế toán trưởng':
        return 'bg-blue-50 text-blue-700 border border-blue-150';
      case 'Giám đốc tài chính (CFO)':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-150';
      case 'Quản trị viên':
        return 'bg-rose-550/10 text-rose-700 border border-rose-200/50';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-150';
    }
  };

  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Ma Giao Dich', 'Ma HD_PO', 'Khach Hang', 'Nhan Vien Sales', 'Trang Thai Cu', 'Trang Thai Moi', 'Nguoi Thuc Hien', 'Thoi Gian', 'Doanh Thu (VND)', 'Hoa Hong (VND)', 'Ghi Chu Duyet'];
    const rows = logs.map(log => [
      log.id,
      log.dealCode,
      log.customerName,
      log.salespersonName,
      log.oldStatus,
      log.newStatus,
      log.changedBy,
      new Date(log.timestamp).toLocaleString('vi-VN'),
      log.amount,
      log.commission,
      log.note || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bao_Cao_Audit_Log_Hoa_Hong_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5" id="audit-logs-module">
      {/* Module Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
              <ClipboardList className="w-5.5 h-5.5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-tight flex items-center gap-2 font-sans">
                NHẬT KÝ KIỂM TOÁN TÀI CHÍNH & DUYỆT CHI HOA HỒNG (AUDIT LOG)
                <span className="text-[9px] bg-slate-900 text-slate-100 border border-slate-850 px-2 py-0.5 rounded font-black font-sans uppercase">
                  Compliance Ready
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Lưu vết toàn bộ tiến trình thay đổi trạng thái chi trả hoa hồng từ lúc soạn thảo, thẩm kế PIT, duyệt chi cho đến giải ngân thực tế.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 self-stretch md:self-auto justify-end">
            {logs.length > 0 && (
              <>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[11px] font-bold transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất báo cáo CSV</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Xác nhận xóa hoàn toàn lịch sử Audit Log? Hành động này không thể hoàn tác.')) {
                      onClearLogs();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-[11px] font-bold transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa nhật ký</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Highlight Banner / compliance details */}
        <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-150 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Hệ thống tuân thủ kiểm tra chéo (COSO & SOX guidelines). Mọi hoạt động phê duyệt trạng thái đối soát thuế TNCN (PIT) của các tổ chuyên môn vãng lai hoặc nhân sự biên chế đều được ghi nhận vĩnh viễn trên thiết bị nội bộ của Kế toán.
          </p>
        </div>
      </div>

      {/* Control filter panel */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã HĐ, tên khách hàng, tên nhân viên Sales hoặc ghi chú..."
            className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-250 rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
          />
        </div>

        <div className="flex gap-2.5">
          <div className="w-44">
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 text-xs rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">👤 Tất cả Người duyệt</option>
              {uniqueActors.map(actor => (
                <option key={actor} value={actor}>{actor}</option>
              ))}
            </select>
          </div>

          <div className="w-36">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 text-xs rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">🎯 Mọi Trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt chi</option>
              <option value="PAID">Đã chi trả</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Inbox className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <div>
              <p className="text-xs font-extrabold text-slate-700">Chưa có nhật ký ghi nhận</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Tiến hành thêm hợp đồng hoặc phê duyệt thay đổi trạng thái chi trả hoa hồng để ghi nhận lịch sử.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Thông tin Hợp đồng / PO</th>
                  <th className="py-3 px-4">Nhân viên Sales</th>
                  <th className="py-3 px-4 text-center">Tiến trình thay đổi</th>
                  <th className="py-3 px-4">Vai trò phê duyệt nhận</th>
                  <th className="py-3 px-5">Ghi chú đối soát nội bộ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map(log => {
                  const date = new Date(log.timestamp);
                  const timeString = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const dateString = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-[10.5px] text-slate-500">
                        <div className="font-extrabold text-slate-700">{timeString}</div>
                        <div>{dateString}</div>
                      </td>

                      {/* Deal Code & Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-slate-800 text-[11px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
                          {log.dealCode}
                        </div>
                        <div className="text-[10.5px] text-slate-405 font-medium max-w-xs truncate" title={log.customerName}>
                          {log.customerName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                          Doanh số: <span className="font-mono font-bold text-slate-500">{formatVND(log.amount)}</span>
                        </div>
                      </td>

                      {/* Sales agent */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <User className="w-3.5 h-3.5 text-slate-450" />
                          <span>{log.salespersonName}</span>
                        </div>
                        <div className="text-[10px] text-emerald-600 font-mono mt-0.5 font-bold">
                          + {formatVND(log.commission)}
                        </div>
                      </td>

                      {/* State Transition */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-150">
                          {getStatusBadge(log.oldStatus)}
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          {getStatusBadge(log.newStatus)}
                        </div>
                      </td>

                      {/* Changed By actor */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${getActorColor(log.changedBy)}`}>
                          <User className="w-3 h-3" />
                          {log.changedBy}
                        </span>
                      </td>

                      {/* Audit change note */}
                      <td className="py-3.5 px-5 max-w-xs whitespace-normal">
                        <div className="text-[10.5px] italic text-slate-500 line-clamp-2 leading-relaxed">
                          {log.note || <span className="text-slate-300 not-italic">--- Không có ghi chú duyệt chi ---</span>}
                        </div>
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
  );
};

// Internal mini-helper
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
