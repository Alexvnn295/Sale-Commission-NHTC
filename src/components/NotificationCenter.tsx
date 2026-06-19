import React from 'react';
import { 
  Mail, 
  Send, 
  Check, 
  Loader2, 
  User, 
  Clock, 
  ArrowUpRight, 
  Filter, 
  Trash2, 
  Inbox, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Settings, 
  RefreshCw,
  Copy,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';
import { EmailNotification, EmailNotifyStatus, SalesPerson } from '../types';
import { formatVND } from '../taxUtils';

interface NotificationCenterProps {
  notifications: EmailNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<EmailNotification[]>>;
  salespersons: SalesPerson[];
  autoTrigger: boolean;
  setAutoTrigger: (val: boolean) => void;
  bccAddress: string;
  setBccAddress: (val: string) => void;
  includePITDetails: boolean;
  setIncludePITDetails: (val: boolean) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  setNotifications,
  salespersons,
  autoTrigger,
  setAutoTrigger,
  bccAddress,
  setBccAddress,
  includePITDetails,
  setIncludePITDetails,
}) => {
  const [selectedId, setSelectedId] = React.useState<string>('');
  const [filterStatus, setFilterStatus] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
  const [copiedId, setCopiedId] = React.useState<string>('');

  // Set default selection when notifications list changes
  React.useEffect(() => {
    if (notifications.length > 0 && !selectedId) {
      setSelectedId(notifications[0].id);
    }
  }, [notifications, selectedId]);

  // Filter & Search log logic
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter(notif => {
      const matchStatus = filterStatus === 'ALL' || notif.sentStatus === filterStatus;
      const matchSearch = searchQuery.trim() === '' || 
        notif.salespersonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.salespersonEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.dealCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.subject.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchStatus && matchSearch;
    });
  }, [notifications, filterStatus, searchQuery]);

  const activeNotification = React.useMemo(() => {
    return notifications.find(n => n.id === selectedId) || null;
  }, [notifications, selectedId]);

  // Handle single record mail deletion
  const handleDelete = (id: string) => {
    if (confirm('Xác nhận xóa biên bản nhật ký email này?')) {
      const updated = notifications.filter(n => n.id !== id);
      setNotifications(updated);
      if (selectedId === id) {
        setSelectedId(updated.length > 0 ? updated[0].id : '');
      }
    }
  };

  // Clear all history logs
  const handleClearAll = () => {
    if (confirm('CẢNH BÁO: Hành động này sẽ xóa toàn bộ lịch sử biên bản thông tin email đã lưu. Bạn chắc chắn muốn tiếp tục?')) {
      setNotifications([]);
      setSelectedId('');
    }
  };

  // Re-simulate individual mail SMTP transport flow
  const handleResendSMTP = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, sentStatus: 'WAITING' } : n)
    );
    
    // Simulate SMTP network call
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, sentStatus: 'SUCCESS' } : n)
      );
    }, 1200);
  };

  // Execute mailto client dispatch URL
  const handleOpenMailto = (notif: EmailNotification) => {
    const to = encodeURIComponent(notif.salespersonEmail);
    const subject = encodeURIComponent(notif.subject);
    
    let bodyWithFooter = notif.bodyText;
    if (bccAddress.trim()) {
      bodyWithFooter += `\n\n[Bcc Bản Sao Lãnh Đạo: ${bccAddress}]`;
    }
    
    const body = encodeURIComponent(bodyWithFooter);
    const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;
    
    // Attempt client opening
    window.location.href = mailtoUrl;

    // Mark as Mailopened for auditing
    setNotifications(prev => 
      prev.map(n => n.id === notif.id ? { ...n, sentStatus: 'MAILTO_OPENED' } : n)
    );
  };

  // Copy body text helper
  const handleCopyBody = (notif: EmailNotification) => {
    navigator.clipboard.writeText(notif.bodyText);
    setCopiedId(notif.id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Compute stats metrics dynamically
  const stats = React.useMemo(() => {
    const total = notifications.length;
    const queued = notifications.filter(n => n.sentStatus === 'WAITING').length;
    const sent = notifications.filter(n => n.sentStatus === 'SUCCESS').length;
    const mailto = notifications.filter(n => n.sentStatus === 'MAILTO_OPENED').length;

    return { total, queued, sent, mailto };
  }, [notifications]);

  return (
    <div className="space-y-4" id="email-notifications-module">
      {/* 1. Header Banner & Dynamic Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
              <Mail className="w-5.5 h-5.5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-tight flex items-center gap-1.5 font-sans">
                TRUNG TÂM EMAIL & THÔNG BÁO HOA HỒNG TỰ ĐỘNG
                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-250 px-2 py-0.5 rounded font-black font-sans uppercase animate-pulse">
                  SMTP Ready
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Tự động sinh mẫu thư tiếng Việt chuẩn mực, thông báo thu nhập và khấu trừ thuế thu nhập cá nhân (PIT) khi duyệt chi doanh số.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isSettingsOpen 
                  ? 'bg-slate-900 border-slate-900 text-white' 
                  : 'bg-white border-slate-250 text-slate-650 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cấu Hình Quy Tắc</span>
            </button>
            
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-bold transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Nhật Ký</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Metric Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Tổng thông báo phát sinh</span>
            <p className="text-xl font-black text-slate-800 font-mono mt-0.5">{stats.total} Emails</p>
            <span className="text-[9px] text-slate-400">Đã cập nhật tự động</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-amber-600 tracking-wider">Hàng gửi đang chờ (Queue)</span>
            <p className="text-xl font-black text-amber-700 font-mono mt-0.5 flex items-center gap-1.5">
              {stats.queued}
              {stats.queued > 0 && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
            </p>
            <span className="text-[9px] text-amber-500">Mô phỏng mạng SMTP</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider">Gửi thành công (SMTP)</span>
            <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">{stats.sent} Hộp thư</p>
            <span className="text-[9px] text-emerald-500">Đã thông báo tới Sales</span>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-blue-600 tracking-wider">Đã mở Client gửi thật</span>
            <p className="text-xl font-black text-blue-700 font-mono mt-0.5">{stats.mailto} Mailto</p>
            <span className="text-[9px] text-blue-500">Mở Outlook/Gmail</span>
          </div>
        </div>
      </div>

      {/* 2. Collapsible Settings Panel */}
      {isSettingsOpen && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 animate-in slide-in-from-top-3 duration-200">
          <div className="border-b border-white/10 pb-2.5 flex items-center gap-2">
            <Settings className="w-4.5 h-4.5 text-blue-400" />
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-100">Bảng Quản Trị Cấu Hình Tự Động Hóa Thông Báo</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Toggle 1: Auto Trigger */}
            <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="text-[11px] font-black text-slate-200 uppercase tracking-tight">Kích hoạt thông báo tự động</h5>
                  <p className="text-[10px] text-slate-400 leading-snug mt-0.5">Tự động soạn thảo và xếp hàng gửi email khi thay đổi trạng thái duyệt chi giao dịch.</p>
                </div>
              </div>
              <button
                onClick={() => setAutoTrigger(!autoTrigger)}
                className={`mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  autoTrigger 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                    : 'bg-transparent border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {autoTrigger ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>{autoTrigger ? 'ĐANG BẬT (Khuyên dùng)' : 'ĐANG TẮT'}</span>
              </button>
            </div>

            {/* Config 2: BCC Board of Directors */}
            <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-850">
              <h5 className="text-[11px] font-black text-slate-200 uppercase tracking-tight">Gửi kèm bản sao ẩn danh (BCC)</h5>
              <p className="text-[10px] text-slate-400 leading-snug">Chuyển phát bản sao kiểm duyệt cho Ban Giám đốc hoặc Phòng Kế toán kiểm soát rủi ro.</p>
              <div className="pt-2">
                <input
                  type="email"
                  value={bccAddress}
                  onChange={(e) => setBccAddress(e.target.value)}
                  placeholder="Viết email BCC..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono font-bold text-indigo-300 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Toggle 3: Deep Tax Simulator Note Inclusion */}
            <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex flex-col justify-between">
              <div>
                <h5 className="text-[11px] font-black text-slate-200 uppercase tracking-tight">Đính kèm quy tắc thuế PIT việt nam</h5>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5">Tự động đính kèm liên kết giải trình và phân tóm lược quy tắc biểu thuế lũy tiến từng phần vào chân thư gửi.</p>
              </div>
              <button
                onClick={() => setIncludePITDetails(!includePITDetails)}
                className={`mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  includePITDetails 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                    : 'bg-transparent border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {includePITDetails ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>{includePITDetails ? 'TỰ ĐỘNG ĐÍNH KÈM' : 'BỎ QUA GIẢI TRÌNH'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left COLUMN: Log List (Span 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-[520px]">
          {/* List Search & Filter Control Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2 shrink-0">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã HĐ, tên Sale, email..."
                className="flex-1 bg-white border border-slate-250 p-1.5 text-xs rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-250 text-xs rounded-lg p-1 px-1.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">📬 Tất cả</option>
                <option value="WAITING">🟡 Chờ gửi</option>
                <option value="SUCCESS">🟢 Thành công</option>
                <option value="MAILTO_OPENED">🔵 Đã Client</option>
              </select>
            </div>
          </div>

          {/* Scrolling Records Panel */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 space-y-2">
                <Inbox className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold">Không tìm thấy bản ghi email nào</p>
                <p className="text-[10px] text-slate-400 text-center leading-relaxed">Hãy cập nhật trạng thái hợp đồng trong Sổ Hợp Đồng để hệ thống tự động sinh thông báo!</p>
              </div>
            ) : (
              filteredNotifications.map(notif => {
                const isActive = notif.id === selectedId;
                const dateObj = new Date(notif.dateTriggered);
                const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                return (
                  <div
                    key={notif.id}
                    onClick={() => setSelectedId(notif.id)}
                    className={`p-3.5 text-left transition-all cursor-pointer relative ${
                      isActive 
                        ? 'bg-slate-900 text-white' 
                        : 'hover:bg-slate-50 text-slate-705 bg-white'
                    }`}
                  >
                    {/* Active Accent Border */}
                    {isActive && <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-indigo-500" />}

                    <div className="flex justify-between items-start gap-1">
                      <div className="space-y-0.5">
                        <h5 className={`text-xs font-black ${isActive ? 'text-white' : 'text-slate-850'}`}>
                          {notif.salespersonName}
                        </h5>
                        <p className={`text-[10px] font-mono ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                          {notif.salespersonEmail}
                        </p>
                      </div>
                      <span className={`text-[9px] font-mono shrink-0 font-bold ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {timeStr} {dateStr}
                      </span>
                    </div>

                    <p className={`text-xs mt-1.5 font-bold truncate ${isActive ? 'text-slate-200' : 'text-slate-700'}`}>
                      {notif.subject}
                    </p>

                    <div className="flex justify-between items-center gap-2 mt-2">
                      <span className={`text-[9px] font-mono font-bold uppercase rounded p-1 tracking-tight ${
                        isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                      }`}>
                        Mã: {notif.dealCode}
                      </span>

                      {/* Status Badges */}
                      {notif.sentStatus === 'WAITING' && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 animate-pulse bg-amber-500/10 px-1.5 py-0.5 rounded">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          ĐANG CHỜ
                        </span>
                      )}
                      {notif.sentStatus === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          ĐÃ GỬI SMTP
                        </span>
                      )}
                      {notif.sentStatus === 'MAILTO_OPENED' && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          <ExternalLink className="w-3 h-3" />
                          MAILTO OPENED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right COLUMN: Interactive Mail Previewer (Span 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-[520px]">
          {activeNotification ? (
            <div className="flex flex-col h-full bg-slate-50">
              {/* Mail Header Panel */}
              <div className="bg-white p-4.5 border-b border-slate-200 shrink-0 space-y-2 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Trình Duyệt Thư Điện Tử</span>
                    <h4 className="text-sm font-black text-slate-850 flex items-center gap-1.5">
                      <Mail className="w-4.5 h-4.5 text-indigo-500" />
                      Chi Tiết Thư Để Chuyển Phát
                    </h4>
                  </div>

                  {/* Mail Action Triggers */}
                  <div className="flex items-center gap-1.5 select-none self-end">
                    <button
                      onClick={() => handleCopyBody(activeNotification)}
                      className="p-1.5 bg-slate-50 border border-slate-250 hover:bg-slate-100 rounded-lg text-slate-650 transition-all flex items-center gap-1 text-[11px] font-bold"
                      title="Chép nội dung thư để tự biên soạn"
                    >
                      {copiedId === activeNotification.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã Chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Chép Thư</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleResendSMTP(activeNotification.id)}
                      className="p-1.5 bg-slate-50 border border-slate-250 hover:bg-slate-100 rounded-lg text-slate-650 transition-all flex items-center gap-1 text-[11px] font-bold"
                      title="Chạy mô phỏng lại luồng gửi"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Nháy SMTP</span>
                    </button>

                    <button
                      onClick={() => handleOpenMailto(activeNotification)}
                      className="p-1.5.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all flex items-center gap-1 px-3 py-1.5 text-xs font-extrabold shadow-xs"
                      title="Mở mailto để chuyển tiếp thực tế"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Mở Outlook/Gmail
                    </button>
                  </div>
                </div>

                {/* Email Address details block */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 pt-2.5 border-t border-slate-100 text-xs font-mono text-slate-600">
                  <div className="md:col-span-2 font-bold text-slate-400">Người Gửi:</div>
                  <div className="md:col-span-10 text-slate-800">Bộ phận Kế toán & Vận hành &lt;noreply@commission-system.vn&gt;</div>

                  <div className="md:col-span-2 font-bold text-slate-400">Người Nhận:</div>
                  <div className="md:col-span-10 font-bold text-indigo-650 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    {activeNotification.salespersonName} &lt;{activeNotification.salespersonEmail}&gt;
                  </div>

                  {bccAddress.trim() && (
                    <>
                      <div className="md:col-span-2 font-bold text-slate-400">BCC ẩn:</div>
                      <div className="md:col-span-10 text-slate-500 italic">{bccAddress}</div>
                    </>
                  )}

                  <div className="md:col-span-2 font-bold text-slate-400">Tiêu Đề:</div>
                  <div className="md:col-span-10 font-sans font-black text-slate-900">{activeNotification.subject}</div>
                </div>
              </div>

              {/* Mail Body Text Box */}
              <div className="flex-1 p-5 overflow-y-auto bg-white">
                <div className="max-w-prose mx-auto border border-slate-100 p-5 rounded-2xl shadow-2xs relative bg-slate-50/10">
                  {/* Decorative envelope seal */}
                  <div className="absolute top-0 right-0 p-3 text-slate-100 leading-none pointer-events-none select-none">
                    <Mail className="w-16 h-16 stroke-[0.5]" />
                  </div>

                  <pre className="font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed select-text tracking-normal">
                    {activeNotification.bodyText}
                  </pre>
                  
                  {includePITDetails && (
                    <div className="mt-6 pt-4 border-t border-dashed border-slate-200 text-[10.5px] text-slate-450 leading-relaxed font-sans bg-slate-50 p-3 rounded-lg border border-slate-150">
                      <span className="font-bold text-slate-800 flex items-center gap-1 mb-1 font-sans text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 inline shrink-0" />
                        PHỤ LỤC TRA CỨU ĐI KÈM:
                      </span>
                      Doanh nghiệp thực hiện trích giữ nghĩa vụ thuế thu nhập cá nhân đối với tất cả các thầu hoa hồng theo đúng luật quản lý thuế nước Cộng hòa Xã hội Chủ nghĩa Việt Nam năm 2026. Để tra cứu chi tiết công thức khấu trừ, Biểu thuế lũy tiến lũy kế 7 bậc hoặc giảm gia cảnh cá nhân, vui lòng liên kết trực tiếp tới cổng thông tin nội bộ của công ty.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 space-y-3">
              <div className="p-3 bg-slate-50 text-slate-350 rounded-full border border-slate-200">
                <Mail className="w-12 h-12 stroke-[1]" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-black text-slate-700">Chưa Chọn Nhật Ký Thư</p>
                <p className="text-xs text-slate-400 max-w-xs">Chọn bất kỳ một bản ghi email ở cột danh sách để xem chi tiết cấu trúc nội dung thư và tiến hành thao tác chuyển phát.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
