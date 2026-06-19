export type ContractType = 'V_LAI' | 'HD_LAO_DONG';

export interface SalesPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  contractType: ContractType;
  baseSalary: number; // Lương cơ bản
  dependents: number; // Số người phụ thuộc
  joinDate: string;
}

export type DealStatus = 'PENDING' | 'APPROVED' | 'PAID';

export interface Deal {
  id: string;
  code: string; // Mã Hợp đồng, PO
  customerName: string; // Tên khách hàng
  salespersonId: string; // ID Sale phụ trách
  amount: number; // Doanh thu
  commissionRate: number; // Phần trăm hoa hồng (Mặc định 5% = 0.05)
  date: string; // Ngày ký kết
  status: DealStatus; // Trạng thái: Chờ duyệt, Đã duyệt, Đã chi trả
  note?: string;
}

export interface PITDetailedTax {
  grossIncome: number; // Lương cơ bản + Hoa hồng được tính
  commissionComponent: number; // Phần hoa hồng góp vào
  baseSalaryComponent: number; // Phần lương cơ bản góp vào
  deductions: {
    personal: number; // Giảm trừ bản thân (11M)
    dependents: number; // Giảm trừ người phụ thuộc (4.4M * số dependents)
    insurance: number; // Giảm trừ BHXH (10.5% của Lương cơ bản)
    total: number;
  };
  taxableIncome: number; // Thu nhập tính thuế
  brackets: Array<{
    level: number;
    range: string;
    rate: number;
    incomeInBracket: number;
    taxInBracket: number;
  }>;
  totalTax: number; // Tổng thuế phải nộp
  netIncome: number; // Thực nhận sau thuế
}

export type EmailNotifyStatus = 'SUCCESS' | 'WAITING' | 'MAILTO_OPENED';

export interface EmailNotification {
  id: string;
  dealId: string;
  dealCode: string;
  customerName: string;
  salespersonId: string;
  salespersonName: string;
  salespersonEmail: string;
  oldStatus: DealStatus | 'NEW';
  newStatus: DealStatus;
  amount: number;
  commission: number;
  dateTriggered: string;
  subject: string;
  bodyText: string;
  sentStatus: EmailNotifyStatus;
}

export interface AuditLog {
  id: string;
  dealId: string;
  dealCode: string;
  customerName: string;
  salespersonName: string;
  oldStatus: DealStatus | 'NEW';
  newStatus: DealStatus;
  changedBy: string; // Vai trò thực hiện thay đổi
  timestamp: string;
  amount: number;
  commission: number;
  note?: string;
}
