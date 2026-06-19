import { SalesPerson, Deal } from './types';

export const INITIAL_SALESPERSONS: SalesPerson[] = [
  {
    id: 's1',
    name: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@company.com',
    phone: '0912345678',
    contractType: 'HD_LAO_DONG',
    baseSalary: 12000000, // 12,000,000 VND basic salary
    dependents: 1, // 1 người phụ thuộc
    joinDate: '2025-01-10',
  },
  {
    id: 's2',
    name: 'Trần Thị Thu Thủy',
    email: 'thuy.tran@company.com',
    phone: '0987654321',
    contractType: 'HD_LAO_DONG',
    baseSalary: 15000000, // 15,000,000 VND basic salary
    dependents: 2, // 2 người phụ thuộc
    joinDate: '2024-05-15',
  },
  {
    id: 's3',
    name: 'Lê Hoàng Hải',
    email: 'hai.le@company.com',
    phone: '0933445566',
    contractType: 'V_LAI', // Freelance / Casual
    baseSalary: 0, // No base salary
    dependents: 0,
    joinDate: '2025-03-01',
  },
  {
    id: 's4',
    name: 'Phạm Thanh Hương',
    email: 'huong.pham@company.com',
    phone: '0955667788',
    contractType: 'HD_LAO_DONG',
    baseSalary: 10000000,
    dependents: 0,
    joinDate: '2025-02-20',
  },
  {
    id: 's5',
    name: 'Vũ Đức Toàn',
    email: 'toan.vu@company.com',
    phone: '0977889900',
    contractType: 'V_LAI',
    baseSalary: 0,
    dependents: 0,
    joinDate: '2025-05-12',
  }
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'd1',
    code: 'HD-2026-001',
    customerName: 'Tập đoàn Điện lực Việt Nam (EVN)',
    salespersonId: 's1',
    amount: 320000000, // 320,000,000 VND (Commission is 16,000,000 VND)
    commissionRate: 0.05,
    date: '2026-06-02',
    status: 'PAID',
    note: 'Hợp đồng triển khai hệ thống quản trị nội bộ Giai đoạn 1',
  },
  {
    id: 'd2',
    code: 'PO-2026-045',
    customerName: 'Công ty Cổ phần sữa Việt Nam (Vinamilk)',
    salespersonId: 's2',
    amount: 1500000000, // 1,500,000,000 VND (Commission is 75,000,000 VND)
    commissionRate: 0.05,
    date: '2026-06-05',
    status: 'APPROVED',
    note: 'PO Cung cấp thiết bị hạ tầng Cloud Server',
  },
  {
    id: 'd3',
    code: 'HD-2026-009',
    customerName: 'Ngân hàng TMCP Ngoại Thương (Vietcombank)',
    salespersonId: 's3',
    amount: 450000000, // 450,000,000 VND (Commission is 22,500,000 VND - Tax is 10% = 2,250,000)
    commissionRate: 0.05,
    date: '2026-06-10',
    status: 'PAID',
    note: 'Hợp đồng tư vấn đào tạo nhân sự CNTT nâng cao',
  },
  {
    id: 'd4',
    code: 'HD-2026-012',
    customerName: 'Công ty TNHH Phần mềm FPT',
    salespersonId: 's1',
    amount: 90000000, // 90,000,000 VND (Commission is 4,500,000 VND)
    commissionRate: 0.05,
    date: '2026-06-12',
    status: 'APPROVED',
    note: 'Nâng cấp license phần mềm quản lý bảo mật',
  },
  {
    id: 'd5',
    code: 'PO-2026-078',
    customerName: 'Tập đoàn Vingroup (Vinhomes)',
    salespersonId: 's4',
    amount: 800000000, // 800,000,000 VND (Commission is 40,000,000 VND)
    commissionRate: 0.05,
    date: '2026-06-14',
    status: 'PENDING',
    note: 'PO thầu gói giải pháp IoT giám sát tòa nhà thông minh',
  },
  {
    id: 'd6',
    code: 'HD-2026-018',
    customerName: 'Công ty Cổ phần Thế Giới Di Động',
    salespersonId: 's5',
    amount: 35000000, // 35,000,000 VND (Commission is 1,750,000 VND - Under 2M so PIT is 0%)
    commissionRate: 0.05,
    date: '2026-06-15',
    status: 'APPROVED',
    note: 'Thiết kế Landing Page chiến dịch truyền thông hè',
  },
  {
    id: 'd7',
    code: 'HD-2026-020',
    customerName: 'Tổng Công ty Hàng không Việt Nam (Vietnam Airlines)',
    salespersonId: 's2',
    amount: 600000000, // 600,000,000 VND (Commission is 30,000,000 VND)
    commissionRate: 0.05,
    date: '2026-06-16',
    status: 'PENDING',
    note: 'Hợp đồng xây dựng module đặt vé nâng cao tích hợp AI',
  }
];
