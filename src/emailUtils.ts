import { Deal, SalesPerson, DealStatus } from './types';
import { formatVND } from './taxUtils';

export function getStatusLabel(status: DealStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Chờ duyệt nghiệm thu';
    case 'APPROVED':
      return 'Đã duyệt (Chờ chi trả)';
    case 'PAID':
      return 'Đã chi trả & khấu trừ thuế';
    default:
      return status;
  }
}

export function generateEmailContent(
  deal: Deal,
  salesperson: SalesPerson,
  oldStatus: DealStatus | 'NEW',
  newStatus: DealStatus
) {
  const comm = deal.amount * deal.commissionRate;
  const newStatusLabel = getStatusLabel(newStatus);
  const oldStatusLabel = oldStatus === 'NEW' ? 'Khởi tạo hợp đồng mới' : getStatusLabel(oldStatus);
  
  // Realtime display in Vietnam format
  const triggerTime = new Date().toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  let subject = '';
  if (oldStatus === 'NEW') {
    subject = `[NOTIFY] Ghi nhận hợp đồng số ${deal.code} - Doanh thu Sale phụ trách`;
  } else if (newStatus === 'APPROVED') {
    subject = `[NOTIFY] Duyệt chi hoa hồng hợp đồng ${deal.code} - Chờ kế toán thanh toán`;
  } else if (newStatus === 'PAID') {
    subject = `[NOTIFY] Xác nhận ĐÃ CHI TRẢ hoa hồng hợp đồng ${deal.code}`;
  } else {
    subject = `[NOTIFY] Cập nhật trạng thái hợp đồng ${deal.code} -> ${newStatusLabel}`;
  }

  const bodyText = `Kính gửi Anh/Chị ${salesperson.name},

Hệ thống Tính toán & Phân phối Hoa hồng tự động xin thông báo về việc thay đổi trạng thái giao dịch hợp đồng do Anh/Chị phụ trách như sau:

--- THÔNG TIN CHUNG ---
- Mã hợp đồng/PO: ${deal.code}
- Khách hàng: ${deal.customerName}
- Ngày hiệu lực: ${deal.date}
- Đại diện phụ trách: ${salesperson.name} (${salesperson.email})

--- THÔNG TIN DOANH SỐ & HOA HỒNG ---
- Doanh thu ghi nhận: ${formatVND(deal.amount)}
- Tỷ lệ trích thưởng: ${(deal.commissionRate * 100).toFixed(1)}%
- Hoa hồng phát sinh (trước thuế): ${formatVND(comm)}
- Diện hợp đồng nhân sự: ${
    salesperson.contractType === 'HD_LAO_DONG' 
      ? 'Chính thức (Tính thuế TNCN lũy tiến gộp chung lương cơ bản)' 
      : 'Cộng tác viên vãng lai (Khấu trừ 10% tại nguồn nếu hoa hồng >= 2,000,000 VND)'
  }

--- TRẠNG THÁI GIAO DỊCH TIỀN ---
- Trạng thái cũ: [${oldStatusLabel}]
- Trạng thái hiện tại: [${newStatusLabel}] -> ĐƯỢC CẬP NHẬT TỰ ĐỘNG
- Thời gian hệ thống ghi nhận: ${triggerTime}

--- QUY TRÌNH THUẾ & CHI TRẢ KẾ TOÁN ---
* Trường hợp hợp đồng ĐÃ DUYỆT (Chờ chi): Kỳ chi trả hoa hồng của bạn đang được Phòng Kế toán đối soát và lập phiếu chi dự kiến vào kỳ lương gần nhất.
* Trường hợp hợp đồng ĐÃ CHI TRẢ: Số tiền thực nhận (Net) đã được giải ngân vào tài khoản ngân hàng liên kết của bạn. Vui lòng kiểm tra báo cáo biến động số dư.
* Thuế thu nhập cá nhân (PIT): Được dự phòng tại nguồn và quyết toán đầy đủ theo quy định của Tổng cục Thuế.

Nếu Anh/Chị phát hiện có sự sai lệch về dữ liệu cơ sở hoặc phần trăm hoa hồng, vui lòng gửi phản hồi trực tiếp cho Quản trị viên hệ thống thông qua hộp thư hoặc phản hồi lại thông tin này.

Trân trọng đối tác kinh doanh,
Bộ phận Vận hành Kinh doanh & Kế toán Tài chính.`;

  return { subject, bodyText };
}
