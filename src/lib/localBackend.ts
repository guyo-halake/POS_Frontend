import { initialUsers, type User } from '@/data/users';
import { initialProducts, type Product } from '@/data/products';

const USERS_KEY = 'local_users';
const PRODUCTS_KEY = 'local_products';
const SALES_KEY = 'local_sales';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localBackend write error', e);
  }
}

// Initialize storage if empty
if (!localStorage.getItem(USERS_KEY)) write(USERS_KEY, initialUsers);
if (!localStorage.getItem(PRODUCTS_KEY)) write(PRODUCTS_KEY, initialProducts);
if (!localStorage.getItem(SALES_KEY)) write(SALES_KEY, []);

export async function handleLocalRequest(path: string, options?: RequestInit) {
  const method = (options?.method || 'GET').toUpperCase();

  // Normalize path (strip query)
  const [cleanPath] = path.split('?');

  // Users
  if (cleanPath === '/api/users' && method === 'GET') {
    const users = read<User[]>(USERS_KEY, initialUsers);
    return jsonResponse(users);
  }

  if (cleanPath === '/api/users' && method === 'POST') {
    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const users = read<User[]>(USERS_KEY, initialUsers);
    const newUser: User = { id: `user-${Date.now()}`, avatar: '👤', active: true, ...body } as User;
    users.push(newUser);
    write(USERS_KEY, users);
    return jsonResponse(newUser, 201);
  }

  if (cleanPath === '/api/users/login' && method === 'POST') {
    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const users = read<User[]>(USERS_KEY, initialUsers);
    const found = users.find(u => u.pin === String(body.pin) && u.active);
    if (found) return jsonResponse({ success: true, user: found });
    return jsonResponse({ success: false }, 401);
  }

  if (cleanPath.startsWith('/api/users/') && (method === 'PUT' || method === 'DELETE')) {
    const id = cleanPath.replace('/api/users/', '');
    const users = read<User[]>(USERS_KEY, initialUsers);
    if (method === 'DELETE') {
      const newUsers = users.filter(u => u.id !== id);
      write(USERS_KEY, newUsers);
      return jsonResponse({});
    }
    const updates = options?.body ? JSON.parse(String(options.body)) : {};
    const idx = users.findIndex(u => u.id === id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates };
      write(USERS_KEY, users);
      return jsonResponse(users[idx]);
    }
    return jsonResponse({ error: 'not found' }, 404);
  }

  // Products
  if (cleanPath === '/api/products' && method === 'GET') {
    const products = read<Product[]>(PRODUCTS_KEY, initialProducts);
    return jsonResponse(products);
  }

  if (cleanPath === '/api/products' && method === 'POST') {
    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const products = read<Product[]>(PRODUCTS_KEY, initialProducts);
    const id = Date.now();
    const newProduct: Product = { id, ...body } as Product;
    products.push(newProduct);
    write(PRODUCTS_KEY, products);
    return jsonResponse(newProduct, 201);
  }

  if (cleanPath.startsWith('/api/products/') && (method === 'PUT' || method === 'DELETE')) {
    const idStr = cleanPath.replace('/api/products/', '');
    const id = Number(idStr);
    const products = read<Product[]>(PRODUCTS_KEY, initialProducts);
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return jsonResponse({ error: 'not found' }, 404);

    if (method === 'DELETE') {
      const newProducts = products.filter(p => p.id !== id);
      write(PRODUCTS_KEY, newProducts);
      return jsonResponse({});
    }

    const updates = options?.body ? JSON.parse(String(options.body)) : {};
    products[idx] = { ...products[idx], ...updates } as Product;
    write(PRODUCTS_KEY, products);
    return jsonResponse(products[idx]);
  }

  // Sales
  if (cleanPath === '/api/sales' && method === 'POST') {
    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const sales = read<any[]>(SALES_KEY, []);
    const newSale = { id: `sale-${Date.now()}`, ...body };
    sales.unshift(newSale);
    write(SALES_KEY, sales);
    return jsonResponse(newSale, 201);
  }

  if (cleanPath === '/api/sales' && method === 'GET') {
    const sales = read<any[]>(SALES_KEY, []);
    return jsonResponse(sales);
  }

  // Default: not implemented
  return jsonResponse({ error: 'Not implemented in local backend' }, 501);
}

function jsonResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

export default { handleLocalRequest };
