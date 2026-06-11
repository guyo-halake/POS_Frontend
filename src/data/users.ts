export type UserRole = 'admin' | 'owner' | 'cashier' | 'developer';

export interface BusinessConfig {
  id: number | string;
  name: string;
  email?: string;
  phone?: string;
  logo?: string;
  paymentConfig?: any;
  uiSettings?: {
    showQuickItems: boolean;
    cartStyle: 'modern' | 'receipt';
    layoutDensity: 'compact' | 'spaced';
    theme: 'light' | 'dark';
  };
  receiptSettings?: {
    supermarketName: string;
    footerMessage: string;
    showDate: boolean;
    showServedBy: boolean;
  };
  paymentMng?: {
    type: 'till' | 'paybill' | 'sendMoney' | null;
    tillNumber?: string;
    paybillNumber?: string;
    paybillAccount?: string;
    phoneNumber?: string;
  };
  paymentGateway?: {
    gateway: string;
    defaultMethod: 'Prompt Payment' | 'Till Direct Payment' | 'Cash';
  };
}

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  avatar: string;
  active: boolean;
  email?: string;
  phone?: string;
  business?: BusinessConfig;
  business_id?: string;
}

export const initialUsers: User[] = [
  {
    id: 'admin-001',
    name: 'Razak Guyo',
    pin: '0000',
    role: 'admin',
    avatar: '👨🏽‍💻',
    active: true,
  },
  {
    id: 'admin-002',
    name: 'Joseph Gitari',
    pin: '4545',
    role: 'admin',
    avatar: '👨🏿‍💼',
    active: true,
  },
  {
    id: 'cashier-001',
    name: 'Rosemary',
    pin: '1111',
    role: 'cashier',
    avatar: '👩🏾‍💼',
    active: true,
  },
  {
    id: 'cashier-002',
    name: 'Waweru',
    pin: '8787',
    role: 'cashier',
    avatar: '👨🏾‍💼',
    active: true,
  },
  {
    id: 'cashier-003',
    name: 'David Mutua',
    pin: '3333',
    role: 'cashier',
    avatar: '👨',
    active: true,
  },
  {
    id: 'dev-001',
    name: 'Developer Mode',
    pin: '9999',
    role: 'developer',
    avatar: '🛠️',
    active: true,
  },
];
