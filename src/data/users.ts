export type UserRole = 'admin' | 'owner' | 'cashier' | 'developer';

export interface BusinessConfig {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  logo?: string;
  paymentConfig?: any;
}

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  avatar: string;
  active: boolean;
  business?: BusinessConfig;
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
