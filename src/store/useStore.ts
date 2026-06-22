import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/data/products';
import { User } from '@/data/users';
import { API_BASE_URL } from '@/config/api';
import { apiFetch } from '@/lib/apiClient';
import { toast } from 'sonner';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'mpesa' | 'cash';
  mpesaRef?: string;
  cashierId: string;
  cashierName: string;
  timestamp: Date;
  synced: boolean;
  isRefunded?: boolean;
}

export interface Notification {
  id: string;
  type: 'low-stock' | 'payment' | 'sync' | 'info';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: Date;
  endTime?: Date;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  goods: string | string[];
}

export interface CartTab {
  id: string;
  label: string;
  items: CartItem[];
}

interface AppState {
  // Auth
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLocked: boolean;
  
  // Shift State
  isShiftActive: boolean;
  currentShift: Shift | null;
  shifts: Shift[];
  // Till
  tillNumber: string | number | null;

  // Products & Cart
  products: Product[];
  cart: CartItem[];
  cartTabs: CartTab[];
  activeTabId: string;
  
  // Sales & Reports
  sales: Sale[];
  isSalesHistoryOpen: boolean;
  setSalesHistoryOpen: (open: boolean) => void;
  
  // Notifications
  notifications: Notification[];
  
  // Suppliers
  // Suppliers
  suppliers: Supplier[];
  fetchSuppliers: () => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  // App State
  isOnline: boolean;
  isDarkMode: boolean;
  pendingSyncs: number;
  activeBusinessId: string | number | null; // For multi-tenancy & dev override
  // Screensaver / Inactivity
  inactivityTimeoutMinutes: number;
  allowScreensaverOnMobile: boolean;

  // Hardware State
  scannerConnected: boolean;
  
  // Auth Actions
  setCurrentUser: (user: User | null) => void;
  updateCurrentUserLocal: (updates: Partial<User>) => void;
  setActiveBusiness: (id: string | number) => void;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  lockRegister: () => void;
  unlockRegister: (pin: string) => Promise<boolean>;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Product Actions
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: number, updates: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  updateStock: (id: number, quantity: number) => void;
  
  // Cart Actions
  addToCart: (product: Product, quantity: number) => void;
  updateCartItem: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  
  // Sales Actions
  completeSale: (paymentMethod: 'mpesa' | 'cash', mpesaRef?: string) => Sale | null;
  processRefund: (saleId: string) => void;
  
  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // App Actions
  setOnlineStatus: (status: boolean) => void;
  toggleDarkMode: () => void;
  syncPendingSales: () => void;
  setTillNumber: (id: string | number | null) => void;
  setInactivityTimeoutMinutes: (m: number) => void;
  setAllowScreensaverOnMobile: (v: boolean) => void;
  setScannerConnected: (connected: boolean) => void;

  // Shift Actions
  startShift: () => void;
  endShift: () => void;

  // Cart Tab Actions
  addCartTab: () => void;
  switchCartTab: (id: string) => void;
  removeCartTab: (id: string) => void;
  
  // Computed
  getCartTotal: () => number;
  getLowStockProducts: () => Product[];
  getTodaySales: () => Sale[];
  getSalesTotal: (sales: Sale[]) => number;
  fetchSales: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentUser: null,
      users: [],
            // Fetch users from backend
            fetchUsers: async () => {
              try {
                const res = await apiFetch('/api/users');
                const data = await res.json();
                set({ users: data });
              } catch (err) {
                console.error('Failed to fetch users', err);
              }
            },
      isAuthenticated: false,
      isLocked: false,
      products: [],
      // Fetch products from backend
      fetchProducts: async () => {
        try {
          const businessId = get().activeBusinessId || '11111111-1111-1111-1111-111111111111';
          const res = await apiFetch('/api/products', {
              headers: { 'x-business-id': String(businessId) }
          });
          const data = await res.json();
          set({ products: data });
              } catch (err) {
          console.error('Failed to fetch products, using offline cache', err);
          if (get().products.length === 0) {
            toast.error('Offline and no local products cached. Cannot start selling.');
          } else {
            toast.info('Using offline product cache.');
          }
        }      
            },
      cart: [],
      cartTabs: [{ id: 'tab-1', label: 'Customer 1', items: [] }],
      activeTabId: 'tab-1',
      isShiftActive: false,
      currentShift: null,
      shifts: [],
      tillNumber: null,
      sales: [],
      isSalesHistoryOpen: false,
      notifications: [],
      suppliers: [],
      isOnline: navigator.onLine,
      isDarkMode: false,
      pendingSyncs: 0,
      activeBusinessId: null,
      inactivityTimeoutMinutes: 5,
      allowScreensaverOnMobile: false,
      scannerConnected: false,

      // Auth Actions
      setCurrentUser: (user) => set({ 
        currentUser: user, 
        isAuthenticated: !!user,
        activeBusinessId: user?.business?.id || '11111111-1111-1111-1111-111111111111' 
      }),
      updateCurrentUserLocal: (updates) => set(state => ({
        currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null
      })),
      setActiveBusiness: (id) => set({ activeBusinessId: id }),
      setTillNumber: (id) => set({ tillNumber: id }),
      setInactivityTimeoutMinutes: (m) => set({ inactivityTimeoutMinutes: m }),
      setAllowScreensaverOnMobile: (v) => set({ allowScreensaverOnMobile: v }),
      setScannerConnected: (connected) => set({ scannerConnected: connected }),
      login: async (pin: string) => {
        try {
          const res = await apiFetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
          });
          const data = await res.json();
          if (data.success) {
            const bizId = data.user?.business_id || data.user?.business?.id || '11111111-1111-1111-1111-111111111111';
            set({ 
              currentUser: data.user, 
              isAuthenticated: true,
              isLocked: false,
              activeBusinessId: bizId
            });
            get().fetchProducts();
            get().fetchSales(); // Sync sales history
            return true;
          }
          return false;
        } catch (err) {
          console.error('Login failed, attempting offline fallback', err);
          const { users } = get();
          const localUser = users.find(u => u.pin === pin);
          if (localUser) {
            const bizId = localUser.business_id || localUser.business?.id || '11111111-1111-1111-1111-111111111111';
            set({
              currentUser: localUser,
              isAuthenticated: true,
              isLocked: false,
              activeBusinessId: bizId
            });
            // Calling fetchProducts anyway, it will just fail gracefully and use cached products if still offline
            get().fetchProducts();
            toast.info('Logged in offline. Some features may be restricted.');
            return true;
          }
          toast.error('Login failed. Cannot verify PIN offline.');
          return false;
        }
      },

      logout: () => {
        set({ 
          currentUser: null, 
          isAuthenticated: false, 
          isLocked: false, 
          cart: [], 
          products: [], 
          sales: [],
          suppliers: [],
          cartTabs: [{ id: 'tab-1', label: 'Customer 1', items: [] }],
          activeTabId: 'tab-1',
          activeBusinessId: '11111111-1111-1111-1111-111111111111' 
        });
      },

      lockRegister: () => {
        set({ isLocked: true });
      },

      unlockRegister: async (pin: string) => {
        // First try to authenticate the user (using existing logic, mostly local fallback is good enough for unlock if same user, but we just re-run login logic)
        const success = await get().login(pin);
        if (success) {
          set({ isLocked: false });
        }
        return success;
      },

      addUser: async (userData) => {
        try {
          const res = await apiFetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...userData, avatar: userData.avatar || '👤' })
          });
          const result = await res.json();
          if (result.success && result.user) {
             set(state => ({ users: [...state.users, result.user] }));
             return { success: true };
          }
          return { success: false, error: result.error || 'Failed to add user' };
        } catch (err) {
          console.error("Failed to add user", err);
          return { success: false, error: 'Network error' };
        }
      },

      updateUser: async (id, updates) => {
        set(state => ({
          users: state.users.map(u => u.id === id ? { ...u, ...updates } : u),
        }));
        try {
           await apiFetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
        } catch (err) {
          console.error("Failed to update user", err);
        }
      },

      deleteUser: async (id) => {
        set(state => ({
          users: state.users.filter(u => u.id !== id),
        }));
        try {
           await apiFetch(`/api/users/${id}`, {
             method: 'DELETE'
           });
        } catch (err) {
           console.error("Failed to delete user", err);
        }
      },

      // Product Actions
      addProduct: async (productData) => {
        try {
          const bizId = String(get().activeBusinessId || '11111111-1111-1111-1111-111111111111');
          const res = await apiFetch('/api/products', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-business-id': bizId
            },
            body: JSON.stringify(productData)
          });
          const newProduct = await res.json();
          set(state => ({ products: [...state.products, newProduct] }));
          toast.success("Product successfully synced to cloud database!");
        } catch (err) {
          console.error("Failed to add product to DB", err);
          toast.error("Failed to sync product to cloud. It will be stored locally.");
          // Fallback optimistic update for offline
          const fallbackProduct = { ...productData, id: Date.now() } as Product;
          set(state => ({ products: [...state.products, fallbackProduct] }));
        }
      },

      updateProduct: async (id, updates) => {
        // Optimistic update
        set(state => ({
          products: state.products.map(p => p.id === id ? { ...p, ...updates } : p),
        }));
        try {
          await apiFetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
        } catch (err) {
          console.error("Failed to update product in DB", err);
          // Revert or show error? For now, just log.
        }
      },

      deleteProduct: async (id) => {
        // Optimistic update
        set(state => ({
          products: state.products.filter(p => p.id !== id),
        }));
        try {
          await apiFetch(`/api/products/${id}`, {
            method: 'DELETE'
          });
        } catch (err) {
          console.error("Failed to delete product from DB", err);
        }
      },

      updateStock: async (id, quantity) => {
        const product = get().products.find(p => p.id === id);
        if (product) {
          const newStock = product.stock + quantity;
          // Optimistic update
          set(state => ({
            products: state.products.map(p => 
              p.id === id ? { ...p, stock: Math.max(0, newStock) } : p
            ),
          }));
          
          try {
             await apiFetch(`/api/products/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stock: Math.max(0, newStock) })
            });
          } catch (err) {
             console.error("Failed to sync stock to DB", err);
          }

          // Check for low stock
          if (newStock <= product.lowStockThreshold && newStock > 0) {
            get().addNotification({
              type: 'low-stock',
              title: 'Low Stock Alert',
              message: `${product.name} is running low (${newStock} left)`,
            });
          }
        }
      },

      // Cart Actions
      addToCart: (product, quantity) => {
        const cart = get().cart;
        const existingItem = cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
          set({
            cart: cart.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ cart: [...cart, { product, quantity }] });
        }
      },

      updateCartItem: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
        } else {
          set(state => ({
            cart: state.cart.map(item =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
          }));
        }
      },

      removeFromCart: (productId) => {
        set(state => ({
          cart: state.cart.filter(item => item.product.id !== productId),
        }));
      },

      clearCart: () => {
        set({ cart: [] });
      },

      // Sales Actions
      setSalesHistoryOpen: (open: boolean) => set({ isSalesHistoryOpen: open }),
      
      fetchSales: async () => {
         const businessId = get().activeBusinessId || '11111111-1111-1111-1111-111111111111';
         try {
           const res = await apiFetch('/api/sales', {
              headers: { 'x-business-id': String(businessId) }
           });
           const data = await res.json();
           // Combine local sales that are not synced with cloud sales to avoid data loss
           const localUnsynced = get().sales.filter(s => !s.synced);
           const syncedCloudIds = new Set(data.map((s: any) => s.id));
           // Deduplicate
           const merged = [...localUnsynced.filter(s => !syncedCloudIds.has(s.id)), ...data];
           set({ sales: merged.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) });
         } catch (err) {
           console.error("Failed to fetch sales from cloud", err);
         }
      },

      completeSale: (paymentMethod, mpesaRef) => {
        const { cart, currentUser, isOnline } = get();
        if (cart.length === 0 || !currentUser) return null;

        const total = get().getCartTotal();
        const sale: Sale = {
          id: `sale-${Date.now()}`,
          items: [...cart],
          total,
          paymentMethod,
          mpesaRef,
          cashierId: currentUser.id,
          cashierName: currentUser.name,
          timestamp: new Date(),
          synced: isOnline,
        };

        // Update stock for each item
        cart.forEach(item => {
          get().updateStock(item.product.id, -item.quantity);
        });

        set(state => ({
          sales: [sale, ...state.sales],
          cart: [],
          pendingSyncs: isOnline ? state.pendingSyncs : state.pendingSyncs + 1,
        }));

        // Save sale to Database (Fire & Forget)
        apiFetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale)
        }).catch(err => console.error("Failed to save sale to DB", err));

        // Add payment notification
        get().addNotification({
          type: 'payment',
          title: 'Sale Complete',
          message: `KES ${total.toLocaleString()} via ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash'}`,
        });

        return sale;
      },

      processRefund: (saleId: string) => {
        const saleToRefund = get().sales.find(s => s.id === saleId);
        if (!saleToRefund || saleToRefund.isRefunded || saleToRefund.total < 0) return;

        // Create a negative sale record
        const refundSale: Sale = {
          ...saleToRefund,
          id: `refund-${Date.now()}`,
          total: -saleToRefund.total,
          timestamp: new Date(),
          isRefunded: false, // The refund record itself isn't refunded
          synced: get().isOnline,
        };

        // Mark the original sale as refunded
        const updatedSales = get().sales.map(s => 
          s.id === saleId ? { ...s, isRefunded: true } : s
        );

        // Restock items
        saleToRefund.items.forEach(item => {
          get().updateStock(item.product.id, item.quantity); // add quantity back
        });

        set(state => ({
          sales: [refundSale, ...updatedSales],
          pendingSyncs: get().isOnline ? state.pendingSyncs : state.pendingSyncs + 1,
        }));

        // Fire & Forget to DB
        apiFetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(refundSale)
        }).catch(err => console.error("Failed to save refund to DB", err));
        
        // Add refund notification
        get().addNotification({
          type: 'payment',
          title: 'Refund Processed',
          message: `KES ${saleToRefund.total.toLocaleString()} refunded`,
        });
      },

      // Notification Actions
      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: `notif-${Date.now()}`,
          timestamp: new Date(),
          read: false,
        };
        set(state => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
        }));
      },

      markNotificationRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      // Supplier Actions
      fetchSuppliers: async () => {
        try {
          const bizId = get().activeBusinessId || '11111111-1111-1111-1111-111111111111';
          const res = await apiFetch('/api/suppliers', {
            headers: { 'x-business-id': String(bizId) }
          });
          if (res.ok) {
            const data = await res.json();
            const parsedData = data.map((s: any) => ({
              ...s,
              goods: typeof s.goods === 'string' && s.goods.startsWith('[') ? JSON.parse(s.goods) : s.goods
            }));
            set({ suppliers: parsedData });
          }
        } catch (err) {
          console.error("Failed to fetch suppliers", err);
        }
      },

      addSupplier: async (supplierData) => {
        try {
          const bizId = get().activeBusinessId || '11111111-1111-1111-1111-111111111111';
          const payload = { ...supplierData, goods: JSON.stringify(supplierData.goods) };
          const res = await apiFetch('/api/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-business-id': String(bizId) },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const data = await res.json();
            const newSupplier: Supplier = {
              ...supplierData,
              id: data.id
            };
            set(state => ({ suppliers: [...state.suppliers, newSupplier] }));
            toast.success("Supplier added successfully");
          } else {
            toast.error("Failed to add supplier");
          }
        } catch (err) {
          console.error(err);
          const fallbackSupplier: Supplier = {
            ...supplierData,
            id: `sup-${Date.now()}`
          };
          set(state => ({ suppliers: [...state.suppliers, fallbackSupplier] }));
          toast.success("Supplier added offline");
        }
      },

      deleteSupplier: async (id) => {
        set(state => ({ suppliers: state.suppliers.filter(s => s.id !== id) }));
        try {
          await apiFetch(`/api/suppliers/${id}`, { method: 'DELETE' });
        } catch(err) {
          console.error(err);
        }
      },

      // App Actions
      setOnlineStatus: (status) => {
        set({ isOnline: status });
        if (status && get().pendingSyncs > 0) {
          get().syncPendingSales();
        }
      },

      toggleDarkMode: () => {
        set(state => {
          const newMode = !state.isDarkMode;
          if (newMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { isDarkMode: newMode };
        });
      },

      syncPendingSales: () => {
        const unsyncedSales = get().sales.filter(s => !s.synced);
        set(state => ({
          sales: state.sales.map(s => ({ ...s, synced: true })),
          pendingSyncs: 0,
        }));
        
        if (unsyncedSales.length > 0) {
          get().addNotification({
            type: 'sync',
            title: 'Sync Complete',
            message: `${unsyncedSales.length} sales synced successfully`,
          });
        }
      },

      // Shift Actions
      startShift: () => {
        const { currentUser } = get();
        if (!currentUser) return;
        const shift: Shift = {
          id: `shift-${Date.now()}`,
          cashierId: currentUser.id,
          cashierName: currentUser.name,
          startTime: new Date()
        };
        set({ isShiftActive: true, currentShift: shift });
      },

      endShift: () => {
        const { currentShift, shifts } = get();
        if (currentShift) {
          const endedShift = { ...currentShift, endTime: new Date() };
          set({
            isShiftActive: false,
            currentShift: null,
            shifts: [endedShift, ...shifts],
          });
        }
      },

      // Cart Tab Actions
      addCartTab: () => {
        const { cartTabs, cart, activeTabId } = get();
        // Save current cart first
        const updatedTabs = cartTabs.map(t => t.id === activeTabId ? { ...t, items: cart } : t);
        
        const newId = `tab-${Date.now()}`;
        const newTab = { id: newId, label: `Customer ${updatedTabs.length + 1}`, items: [] };
        
        set({
          cartTabs: [...updatedTabs, newTab],
          activeTabId: newId,
          cart: []
        });
      },

      switchCartTab: (id) => {
        const { cartTabs, cart, activeTabId } = get();
        if (id === activeTabId) return;

        // Save current cart
        const updatedTabs = cartTabs.map(t => t.id === activeTabId ? { ...t, items: cart } : t);
        
        // Load new cart
        const targetTab = updatedTabs.find(t => t.id === id);
        if (targetTab) {
          set({
            cartTabs: updatedTabs,
            activeTabId: id,
            cart: targetTab.items
          });
        }
      },

      removeCartTab: (id) => {
        const { cartTabs, activeTabId } = get();
        if (cartTabs.length <= 1) return; // Don't remove last tab

        const newTabs = cartTabs.filter(t => t.id !== id);
        
        // If we removed the active tab, switch to the first one
        if (id === activeTabId) {
          set({
            cartTabs: newTabs,
            activeTabId: newTabs[0].id,
            cart: newTabs[0].items
          });
        } else {
          set({ cartTabs: newTabs });
        }
      },

      // Computed
      getCartTotal: () => {
        return get().cart.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      getLowStockProducts: () => {
        return get().products.filter(p => p.stock <= p.lowStockThreshold);
      },

      getTodaySales: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return get().sales.filter(s => new Date(s.timestamp) >= today);
      },

      getSalesTotal: (sales) => {
        return sales.reduce((total, sale) => total + sale.total, 0);
      },
    }),
    {
      name: 'freshfity-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        activeBusinessId: state.activeBusinessId,
        products: state.products,
        users: state.users,
        sales: state.sales,
        notifications: state.notifications,
        suppliers: state.suppliers,
        isDarkMode: state.isDarkMode,
        pendingSyncs: state.pendingSyncs,
        shifts: state.shifts,
        currentShift: state.currentShift, // Persist current shift in case of refresh
        isShiftActive: state.isShiftActive,
        cartTabs: state.cartTabs,
        activeTabId: state.activeTabId,
        // We persist 'cart' implicitly as part of loading active tab? 
        // No, 'cart' is separate in state. We should persist it too.
        cart: state.cart,
        tillNumber: state.tillNumber,
        inactivityTimeoutMinutes: state.inactivityTimeoutMinutes,
        allowScreensaverOnMobile: state.allowScreensaverOnMobile,
      }),
    }
  )
);
