import React, { useState, useMemo, useRef, useEffect } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import PaystackPop from '@paystack/inline-js';
import { useStore } from '@/store/useStore';
import { API_BASE_URL } from '@/config/api';
import { Product } from '@/data/products';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Barcode,
  Receipt,
  Plus,
  X,
  FileX,
  Lock,
  Hand,
  XCircle,
  Banknote,
  History,
  CheckCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { QuickItemsGrid } from './QuickItemsGrid';
import { QuickCheckoutModal } from './QuickCheckoutModal';
import { SalesHistoryModal } from './SalesHistoryModal';
import { playBeep, playErrorBuzzer } from '@/lib/audio';

export const POSPage: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    getCartTotal,
    completeSale,
    isShiftActive,
    cartTabs,
    activeTabId,
    addCartTab,
    switchCartTab,
    removeCartTab,
    currentUser,
    updateUser,
    currentShift,
    tillNumber,
    setScannerConnected
  } = useStore();

  const bizName = currentUser?.business?.name || 'FRESH FITY SUPERMARKET';
  const bizLogo = currentUser?.business?.logo;
  const bizPhone = currentUser?.business?.phone || '07XXXXXXXX';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showCameraScan, setShowCameraScan] = useState(false);
  const { isSalesHistoryOpen, setSalesHistoryOpen } = useStore();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isErrorFlash, setIsErrorFlash] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const receiptEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<any>(null);

  const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

  useEffect(() => {
    receiptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cart]);

  // Global Keyboard Shortcuts (Scanner, Spacebar, Delete)
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (showCheckoutModal) return;

      const now = Date.now();
      const isScannerPacing = now - lastKeyTime.current < 100; // Increased to 100ms for slower scanners

      const isInputFocused = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // Spacebar for Checkout (Now requires Shift + Space to prevent accidental triggers)
      if (e.code === 'Space' && e.shiftKey && !isInputFocused) {
        if (!isScannerPacing) {
          e.preventDefault();
          if (useStore.getState().cart.length > 0) {
            setShowCheckoutModal(true);
          }
        }
        return;
      }

      // Delete/Backspace for Void Last Item
      if ((e.code === 'Delete' || e.code === 'Backspace') && !isInputFocused) {
        if (!isScannerPacing) {
          e.preventDefault();
          const currentCart = useStore.getState().cart;
          if (currentCart.length > 0) {
            removeFromCart(currentCart[currentCart.length - 1].product.id);
          }
        }
        return;
      }

      // Barcode Scanner Buffer (rapid characters ending with Enter)
      if (now - lastKeyTime.current > 200) { // Increased reset timeout to 200ms
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = now;

      if (e.code === 'Enter') {
        if (barcodeBuffer.current.length > 1 && isScannerPacing) {
          e.preventDefault();
          
          setScannerConnected(true);

          const product = products.find(p => p.barcode === barcodeBuffer.current);
          if (product) {
            addToCart(product, 1);
            playBeep();
            // If they scanned while focused on an input, blur it and clear it
            if (isInputFocused) {
               (e.target as HTMLElement).blur();
               setSearchQuery('');
            }
          } else {
            setNotFoundBarcode(barcodeBuffer.current);
            playErrorBuzzer();
            setIsErrorFlash(true);
            setTimeout(() => setIsErrorFlash(false), 500);
          }
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products, addToCart, removeFromCart, showCheckoutModal]);

  const handleQuickAdd = (productStub: Partial<Product>) => {
    addToCart(productStub as Product, 1);
    playBeep();
  };

  // Not found modal state
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  // Camera error state
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Last scanned barcode to prevent rapid duplicate processing
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  
  // Click outside logic for Search Results
  const searchContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        // Clear search inputs if focus is lost and not clicking inside
        if (searchQuery) {
           setSearchQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  // Check if search is active
  const isSearching = searchQuery.trim() !== '';

  // Handle camera barcode scan
  const handleCameraScan = (err: any, result: any) => {
    if (result?.text) {
      const code = result.text;
      
      // Prevent processing the same code multiple times in a short window
      if (code === lastScannedCode) return;
      
      const product = products.find(p => p.barcode === code);
      if (product) {
        addToCart(product, 1);
        setLastScannedCode(code);
        // Optional: Play a beep sound here
        setShowCameraScan(false);
      } else {
        // If product not found, don't close the camera immediately.
        // Just show an error message so the user can try again.
        setLastScannedCode(code);
        setCameraError(`Product not found: ${code}`);
        
        // Allow scanning the same (or different) code again after a delay
        setTimeout(() => {
            setLastScannedCode(null);
            setCameraError(null);
        }, 3000);
      }
    }
    
    // Ignore benign scanning errors
    if (err) {
      console.log("Scanner Error:", err); // Log to console
      // Show exact error on screen for mobile debugging
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
         setCameraError('Camera permission denied.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
         setCameraError('No camera found.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
         setCameraError('Camera is in use by another app.');
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
         setCameraError('Camera constraints failed.');
      } else if (err.name === 'StreamApiNotSupportedError') {
         setCameraError('Browser not supported.');
      } else {
         // Show unknown errors so we can debug
         setCameraError(`Camera Error: ${err.name} - ${err.message}`);
      }
    }
  };

  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [quantityModal, setQuantityModal] = useState<{ product: Product; show: boolean } | null>(null);
  const [tempQuantity, setTempQuantity] = useState('1');
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashGiven, setCashGiven] = useState('');
  const [cashError, setCashError] = useState('');
  
  // Custom Mobile Money States
  const [showMpesaPrompt, setShowMpesaPrompt] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [mpesaError, setMpesaError] = useState('');
  const [mpesaWaiting, setMpesaWaiting] = useState(false);
  const [mpesaStatusMessage, setMpesaStatusMessage] = useState('');

  const cartTotal = getCartTotal();

  const getQuickBills = (total: number) => {
    if (total === 0) return [];
    const bills = new Set<number>();
    bills.add(total);
    const rounded100 = Math.ceil(total / 100) * 100;
    const rounded500 = Math.ceil(total / 500) * 500;
    const rounded1000 = Math.ceil(total / 1000) * 1000;
    
    if (rounded100 > total) bills.add(rounded100);
    if (rounded500 > total) bills.add(rounded500);
    if (rounded1000 > total) bills.add(rounded1000);
    if (rounded1000 + 500 > total && rounded1000 + 500 !== rounded500) bills.add(rounded1000 + 500);
    if (rounded1000 * 2 > total) bills.add(rounded1000 * 2);

    return Array.from(bills).sort((a,b) => a-b).slice(0, 4);
  };
  const quickBills = useMemo(() => getQuickBills(cartTotal), [cartTotal]);

  const triggerPrintAndReset = () => {
    setIsPrinting(true);
    setShowReceipt(true);
    
    // Give DOM a tick to render the receipt visibly
    setTimeout(() => {
      window.print();
      
      // Clear after the print dialog returns
      setTimeout(() => {
        setIsPrinting(false);
        setShowReceipt(false);
        clearCart();
        setPaymentSuccessData(null);
      }, 1000);
    }, 100);
  };

  // Filter products using Weighted Scoring Algorithm
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return [];
    
    const query = searchQuery.toLowerCase();
    
    const scoredProducts = products.map(product => {
      let score = 0;
      const name = product.name.toLowerCase();
      const barcode = product.barcode.toLowerCase();
      
      if (barcode === query) score = 100;
      else if (name === query) score = 90;
      else if (name.startsWith(query)) score = 80;
      else if (name.split(' ').some(word => word.startsWith(query))) score = 75;
      else if (barcode.startsWith(query)) score = 70;
      else if (name.includes(query)) score = 50;
      else if (barcode.includes(query)) score = 40;
      
      return { product, score };
    });
    
    return scoredProducts
      .filter(p => p.score > 0 && (!selectedCategory || p.product.category === selectedCategory))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.product.name.localeCompare(b.product.name);
      })
      .map(p => p.product);
  }, [products, searchQuery, selectedCategory]);

  // Handle product click
  const handleProductClick = (product: Product) => {
    if (product.unit === 'kg' || product.unit === 'g') {
      setQuantityModal({ product, show: true });
      setTempQuantity('1');
    } else {
      addToCart(product, 1);
      playBeep();
    }
  };

  // Handle quantity confirm
  const handleQuantityConfirm = () => {
    if (quantityModal) {
      const qty = parseFloat(tempQuantity) || 1;
      addToCart(quantityModal.product, qty);
      playBeep();
      setQuantityModal(null);
    }
  };

  // Handle payment
  const handlePayment = (method: 'paystack' | 'cash' | 'card' | 'mobile') => {
    if (method === 'mobile') {
      setShowMpesaPrompt(true);
      return;
    }

    if (method === 'card') {
      // Simple card flow placeholder: complete sale as 'card'
      const sale = completeSale('card');
      if (sale) {
        setLastSale(sale);
        triggerPrintAndReset();
      }
      return;
    }

    // Open cash modal for input
    setShowCashModal(true);
    setCashGiven('');
    setCashError('');
  };

  const handleCashConfirm = () => {
    const total = cartTotal;
    const given = parseFloat(cashGiven);
    if (isNaN(given) || given < total) {
      setCashError('Cash given must be at least the total amount.');
      return;
    }
    const sale = completeSale('cash');
    if (sale) {
      const enhancedSale = { ...sale, cashGiven: given, change: given - total };
      setLastSale(enhancedSale);
      setShowCashModal(false);
      setShowPayment(false);
      setPaymentSuccessData(enhancedSale);
      playBeep();
    }
  };

  const cancelMpesaPoll = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setMpesaWaiting(false);
    toast.error('Payment verification cancelled');
  };

  const handleMobileMoneyPay = async () => {
    setMpesaLoading(true);
    setMpesaError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/paystack/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: mpesaPhone,
          amount: cartTotal * 100
        })
      });
      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message || 'Payment initiation failed.');
      }

      const reference = data.data.reference;
      
      setShowMpesaPrompt(false);
      setMpesaWaiting(true);
      setMpesaStatusMessage('Sent STK Push to customer...');

      pollIntervalRef.current = setInterval(async () => {
        try {
           const statusRes = await fetch(`${API_BASE_URL}/api/paystack/verify/${reference}`);
           if (!statusRes.ok) {
             const errText = await statusRes.text();
             console.error("Verification endpoint error:", errText);
             setMpesaStatusMessage(`Verification error: Server returned ${statusRes.status}`);
             return;
           }

           const statusData = await statusRes.json();
           
           if (statusData.status && statusData.data.status === 'success') {
             if (pollIntervalRef.current) {
               clearInterval(pollIntervalRef.current);
               pollIntervalRef.current = null;
             }
             setMpesaWaiting(false);
             const sale = completeSale('mpesa', reference);
             if (sale) {
                const enhancedSale = { ...sale, customerPhone: mpesaPhone };
                setLastSale(enhancedSale);
                setPaymentSuccessData(enhancedSale);
             }
             setMpesaPhone('');
             playBeep(); 
           } else if (statusData.status && (statusData.data.status === 'failed' || statusData.data.status === 'abandoned')) {
             if (pollIntervalRef.current) {
               clearInterval(pollIntervalRef.current);
               pollIntervalRef.current = null;
             }
             setMpesaWaiting(false);
             setShowMpesaPrompt(true);
             setMpesaError('Payment Failed or Cancelled.');
           } else {
             const gatewayResponse = statusData.data?.gateway_response || 'Waiting for customer to enter PIN...';
             setMpesaStatusMessage(gatewayResponse);
           }
        } catch (e: any) {
           console.error("Polling error", e);
           setMpesaStatusMessage(`Network error: ${e.message || 'Connecting...'}`);
        }
      }, 3000);

      setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setMpesaWaiting(prev => {
          if (prev) {
             setMpesaError('Request timed out. Check status manually or retry.');
             setShowMpesaPrompt(true);
             return false;
          }
          return false;
        });
      }, 120000);

    } catch (err: any) {
      console.error("Paystack API Error:", err);
      setMpesaError(err.message || 'Failed to initiate payment.');
    } finally {
      setMpesaLoading(false);
    }
  };

  const showQuickItems = currentUser?.business?.uiSettings?.showQuickItems ?? true;

  const handleSearchContainerClick = (e: React.MouseEvent) => {
    if (e.detail === 3) {
      if (currentUser) {
        const currentBiz = currentUser.business || {} as any;
        const currentUI = currentBiz.uiSettings || {};
        updateUser(currentUser.id, {
          business: {
            ...currentBiz,
            uiSettings: {
               ...currentUI,
               showQuickItems: !showQuickItems
            }
          }
        });
        toast.success(`Quick Items widget ${!showQuickItems ? 'enabled' : 'disabled'}`);
      }
    }
  };

  return (
    <div className={cn(
      "grid h-[calc(100vh-6rem)] gap-6 p-4 overflow-hidden transition-colors duration-200 bg-background", 
      isErrorFlash && "bg-red-900/40",
      showQuickItems 
        ? "lg:grid-cols-[180px_minmax(0,1fr)_minmax(400px,1.2fr)] xl:grid-cols-[200px_minmax(0,1fr)_minmax(480px,1.2fr)]"
        : "lg:grid-cols-[minmax(0,1fr)_minmax(400px,1.2fr)] xl:grid-cols-[minmax(0,1fr)_minmax(480px,1.2fr)]"
    )}>
      {/* Quick Items Rail */}
      {showQuickItems && <QuickItemsGrid onQuickAdd={handleQuickAdd} allProducts={products} />}
      
      {/* Main scan/search zone */}
      <div className="flex min-h-0 flex-col rounded-none bg-card p-8" ref={searchContainerRef} onClick={handleSearchContainerClick}>
          <div className="mb-8 flex flex-col gap-4">
            {/* Cart Tabs Navigation */}
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide border-b border-foreground/10">
              {cartTabs.map(tab => (
                <div 
                  key={tab.id}
                  onClick={() => switchCartTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer whitespace-nowrap transition-colors border-b-2",
                    activeTabId === tab.id 
                      ? "border-foreground text-foreground" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {cartTabs.length > 1 && (
                    <X 
                      className="w-3 h-3 hover:text-destructive transition-colors opacity-50 hover:opacity-100 ml-1" 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCartTab(tab.id);
                      }} 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="relative mb-8">
            <Search className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Scan or enter product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-16 rounded-none border-none bg-muted/50 pl-16 pr-14 focus-visible:ring-0 focus-visible:bg-muted transition-colors text-xl font-medium"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 p-0 rounded-none"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          {/* Camera Scan Modal */}
          <Dialog open={showCameraScan} onOpenChange={(open) => {
            setShowCameraScan(open);
            if (!open) {
              setCameraError(null);
              setLastScannedCode(null);
            }
          }}>
            <DialogContent className="max-w-full w-[95vw] sm:w-[400px] p-2 sm:p-6">
              <DialogDescription className="sr-only">Camera</DialogDescription>
              <DialogHeader>
                <DialogTitle>Scan Barcode with Camera</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-2 sm:py-4">
                
                {/* Show error if permissions are denied, but keep scanner mounted */}
                {cameraError && (
                   <div className="text-white bg-red-600 px-3 py-1 rounded text-center text-sm mb-2 w-full">
                     {cameraError}
                   </div>
                )}

                {/* Show last scanned success message overlay */}
                {lastScannedCode && !cameraError && (
                   <div className="text-white bg-green-600 px-3 py-1 rounded text-center text-sm mb-2 w-full">
                     Scanned: {lastScannedCode}
                   </div>
                )}

                <div className="overflow-hidden rounded-lg border bg-black">
                  <BarcodeScannerComponent
                    width={window.innerWidth < 500 ? window.innerWidth * 0.9 : 320}
                    height={window.innerWidth < 500 ? window.innerWidth * 0.9 : 320}
                    onUpdate={handleCameraScan}
                    delay={500} // Reduce CPU usage, scan every 500ms
                  />
                </div>

                <Button variant="outline" onClick={() => setShowCameraScan(false)}>
                  Close Camera
                </Button>
                <div className="text-xs text-muted-foreground text-center">Tip: For best results, hold your phone steady and ensure the barcode is well-lit and in focus.</div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Not Found Error Modal - HARD STOP */}
          <Dialog open={!!notFoundBarcode} onOpenChange={(open) => {
            if (!open) setNotFoundBarcode(null);
          }}>
            <DialogContent className="sm:max-w-md border-destructive/50 bg-destructive/10 backdrop-blur-xl">
              <DialogDescription className="sr-only">Error</DialogDescription>
              <div className="text-center py-6">
                <div className="mx-auto w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                  <FileX className="w-10 h-10 text-destructive" />
                </div>
                <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">ITEM NOT FOUND</h2>
                <div className="font-mono text-xl mb-6 text-muted-foreground bg-background/50 py-2 rounded-lg">{notFoundBarcode}</div>
                <p className="mb-8 text-sm opacity-80">This barcode is not recognized by the system. Please verify the item or add it to inventory.</p>
                <div className="flex gap-3 justify-center">
                  <Button size="lg" variant="outline" className="h-14 px-8 border-destructive/30 hover:bg-destructive hover:text-destructive-foreground font-bold" onClick={() => setNotFoundBarcode(null)}>
                    ACKNOWLEDGE
                  </Button>
                  <Button size="lg" className="h-14 px-8 font-bold" onClick={() => {
                    window.location.href = `/inventory?newBarcode=${notFoundBarcode}`;
                  }}>
                    Add to Inventory
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Product List (search results) - only show if user is typing */}
          {searchQuery.trim() !== '' && (
            <ScrollArea className="flex-1 bg-background/50 rounded-md border p-2 mt-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No products found</div>
              ) : (
                <ul className="divide-y divide-border">
                  {filteredProducts.map(product => (
                    <li
                      key={product.id}
                      className="flex items-center justify-between py-3 px-3 cursor-pointer hover:bg-accent rounded-lg transition-colors border-b last:border-0"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{product.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{product.barcode}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">KES {product.price.toLocaleString()}</div>
                        <span className="text-xs text-muted-foreground">{product.stock} {product.unit}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          )}
          
          <div className="mt-auto flex justify-end gap-2 pt-4">
            <div className="flex gap-2">
              <Button 
                onClick={() => addCartTab()} 
                variant="ghost" 
                className="h-8 px-3 rounded-none bg-transparent hover:bg-muted font-bold gap-2 uppercase tracking-widest text-[10px] text-muted-foreground"
              >
                <Hand className="w-3 h-3" />
                Hold
              </Button>
              <Button 
                onClick={clearCart} 
                variant="ghost" 
                disabled={cart.length === 0}
                className="h-8 px-3 rounded-none font-bold gap-2 uppercase tracking-widest text-[10px] text-destructive hover:bg-destructive/10"
              >
                <XCircle className="w-3 h-3" />
                Clear
              </Button>
            </div>
          </div>
        </div>

      {/* Receipt / Cart - Right Side */}
      <div className={cn("flex min-h-0 flex-col lg:sticky lg:top-4 flex-1 gap-4 transition-transform duration-500", isPrinting ? "receipt-printing" : "")}>
        {/* The Cart Paper/Container */}
        <div className={cn(
          "flex flex-col min-h-[60%] flex-1 text-foreground overflow-hidden pb-4",
          currentUser?.business?.uiSettings?.cartStyle === 'modern'
            ? "bg-card border border-foreground/10 rounded-xl shadow-sm"
            : "receipt-paper rounded-none bg-card mx-2 lg:mx-0 shadow-xl"
        )}>
          <div className="border-b border-foreground/10 px-4 py-8 text-center">
            <div className="flex flex-col items-center gap-1">
              {currentUser?.business?.logo && (
                 <img src={currentUser?.business?.logo} alt="Logo" className="max-w-[120px] max-h-[80px] object-contain mb-2 opacity-80" />
              )}
              <span className="text-xl font-bold uppercase tracking-widest">{currentUser?.business?.name || 'RECEIPT'}</span>
              <span className="text-xs">Till {currentUser?.business?.paymentMng?.tillNumber ?? tillNumber ?? '—'} • {currentUser?.name ?? '—'}</span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-3 text-[10px]">
              <span>Shift {isShiftActive && currentShift ? 'open' : 'closed'}</span>
              <span>•</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
          
          {/* Receipt Items */}
          <ScrollArea className="min-h-0 flex-1 px-4 py-2">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                <Receipt className="mb-3 h-12 w-12" />
                <p className="text-sm font-bold">No items yet</p>
                <p className="text-xs">Scan or search to add items</p>
              </div>
            ) : (
              <div className="w-full text-[0.92rem] leading-tight">
                {(() => {
                  const isCompact = cart.length > 10 || currentUser?.business?.uiSettings?.layoutDensity === 'compact';
                  return (
                <table className={cn("w-full mb-2", isCompact ? "text-xs" : "")}>
                  <thead>
                    <tr className="border-b border-black/20 dark:border-white/20">
                      <th className={cn("pt-1 font-bold text-left", isCompact ? "pb-1" : "pb-2")}>Item</th>
                      <th className={cn("pt-1 font-bold text-center", isCompact ? "pb-1" : "pb-2")}>Qty</th>
                      <th className={cn("pt-1 font-bold text-right", isCompact ? "pb-1" : "pb-2")}>Price</th>
                      <th className={cn("pt-1 font-bold text-right", isCompact ? "pb-1" : "pb-2")}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                  {cart.map((item, idx) => (
                    <tr key={item.product.id} className="receipt-item-enter border-b border-dashed border-black/10 dark:border-white/10">
                      <td className={cn("text-left", isCompact ? "py-1" : "py-2")}>
                        <div className="flex items-center justify-between group">
                          <span className="truncate max-w-[120px]">{item.product.name}</span>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-2 p-1 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Remove ${item.product.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className={cn("text-center", isCompact ? "py-1" : "py-2")}>
                        <button
                          onClick={() => {
                            setQuantityModal({ product: item.product, show: true });
                            setTempQuantity(String(item.quantity));
                          }}
                          className="mx-auto border-b border-dotted border-black/50 dark:border-white/50 hover:bg-black/5 dark:hover:bg-white/5 px-1 rounded transition-colors"
                          title="Edit quantity"
                        >
                          {item.quantity}
                        </button>
                      </td>
                      <td className={cn("text-right", isCompact ? "py-1" : "py-2")}>{item.product.price.toLocaleString()}</td>
                      <td className={cn("text-right font-semibold", isCompact ? "py-1" : "py-2")}>{(item.product.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr><td colSpan={4} style={{ height: '10px' }}></td></tr>
                </tbody>
              </table>
                  );
                })()}
              <div ref={receiptEndRef} />
              <hr className="my-2 border-dashed border-black/20 dark:border-white/20" />
              {/* Subtotal, Tax, Total */}
              <div className="flex flex-col gap-1 mb-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>KES {cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (0%)</span>
                  <span>KES 0</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>KES {cartTotal.toLocaleString()}</span>
                </div>
              </div>
              <hr className="my-2 border-dashed border-black/20 dark:border-white/20" />
              {/* Payment Method */}
              <div className="flex justify-between text-sm mb-1">
                <span>Payment</span>
                <span>{lastSale?.method ? lastSale.method.toUpperCase() : 'Pending'}</span>
              </div>
              {lastSale?.ref && (
                <div className="flex justify-between text-xs mb-1">
                  <span>Txn Ref</span>
                  <span>{lastSale.ref}</span>
                </div>
              )}
              <div className="text-center text-xs opacity-60 mt-4 mb-2">Thank you for your business.</div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Payment Buttons Area - Outside Receipt */}
      <div className="glass-panel rounded-3xl p-4 mt-auto">
        <div className="mb-4 flex items-center justify-between px-2">
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Due</span>
          <span className="text-4xl font-extrabold text-foreground tracking-tight drop-shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="text-xl text-muted-foreground mr-1">KSh</span>
              {cartTotal.toLocaleString()}
            </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handlePayment('mobile')} 
            disabled={cart.length === 0} 
            className="group flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-background/50 hover:bg-background border border-[#00b050]/20 hover:border-[#00b050]/50 shadow-sm hover:shadow-[0_4px_20px_rgba(0,176,80,0.15)] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="text-xl font-black tracking-tighter"><span className="text-red-500">M-</span><span className="text-green-600">PESA</span></span>
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">MOBILE MONEY</span>
          </button>
          
          <button 
            onClick={() => handlePayment('cash')} 
            disabled={cart.length === 0} 
            className="group flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-background/50 hover:bg-background border border-emerald-500/20 hover:border-emerald-500/50 shadow-sm hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center justify-center text-emerald-600 bg-emerald-500/10 rounded-full w-8 h-8">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">CASH</span>
          </button>
        </div>

        <QuickCheckoutModal 
            open={showCheckoutModal}
            onOpenChange={setShowCheckoutModal}
            total={cartTotal}
            onSelectPayment={(method) => {
              setShowCheckoutModal(false);
              setTimeout(() => handlePayment(method), 100); // slight delay to allow dialogs to close cleanly
            }}
          />

              {/* Cash Payment Modal */}
              <Dialog open={showCashModal} onOpenChange={setShowCashModal}>
                <DialogContent className="sm:max-w-md border-0 bg-background shadow-2xl overflow-hidden p-0">
                  <DialogDescription className="sr-only">Cash Payment</DialogDescription>
                  <div className="bg-emerald-600 p-6 text-center text-white">
                     <h3 className="text-emerald-100 font-bold tracking-widest text-xs uppercase mb-1">Total Due</h3>
                     <div className="text-4xl font-black tracking-tighter">
                        <span className="text-emerald-300 text-2xl mr-1">KSh</span>{cartTotal.toLocaleString()}
                     </div>
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Quick Bills</p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {quickBills.map(bill => (
                        <button
                          key={bill}
                          onClick={() => setCashGiven(bill.toString())}
                          className="py-3 px-4 rounded-xl border border-border hover:border-emerald-500 hover:bg-emerald-500/10 font-bold text-lg text-foreground transition-all active:scale-95 flex items-center justify-between"
                        >
                          {bill === cartTotal ? 'Exact' : ''}
                          <span className={bill === cartTotal ? 'text-emerald-500' : ''}>{bill.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">KSh</span>
                      <Input
                        type="number"
                        placeholder="Custom amount..."
                        value={cashGiven}
                        onChange={e => setCashGiven(e.target.value)}
                        className="h-14 pl-12 text-xl font-bold bg-muted/50 border-0 rounded-xl"
                        autoFocus
                      />
                    </div>

                    {cashGiven && !isNaN(Number(cashGiven)) && Number(cashGiven) >= cartTotal && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center mb-6 animate-in slide-in-from-bottom-2">
                        <p className="text-blue-500 font-bold text-xs uppercase tracking-widest mb-1">Change Due</p>
                        <p className="text-4xl font-black text-blue-600 dark:text-blue-400">
                          <span className="text-2xl mr-1">KSh</span>
                          {(Number(cashGiven) - cartTotal).toLocaleString()}
                        </p>
                      </div>
                    )}
                    
                    {cashError && <p className="text-red-500 text-sm mb-4 text-center font-semibold">{cashError}</p>}
                    
                    <Button 
                      onClick={handleCashConfirm} 
                      className="w-full h-14 rounded-xl text-lg font-bold bg-emerald-600 hover:bg-emerald-700"
                      disabled={!cashGiven || Number(cashGiven) < cartTotal}
                    >
                      Confirm Payment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
        </div>



      {/* Quantity Modal */}
      <Dialog open={!!quantityModal?.show} onOpenChange={(open) => !open && setQuantityModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogDescription className="sr-only">Quantity</DialogDescription>
          <DialogHeader>
            <DialogTitle>Enter Quantity</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-4 py-4">
            <Input
              type="number"
              value={tempQuantity}
              onChange={(e) => setTempQuantity(e.target.value)}
              autoFocus
            />
            <span className="text-sm text-muted-foreground">{quantityModal?.product.unit}</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setQuantityModal(null)}>Cancel</Button>
            <Button onClick={handleQuantityConfirm}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Radar Waiting Modal */}
      <Dialog open={mpesaWaiting} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md border-0 bg-zinc-900 transition-colors duration-500">
          <DialogDescription className="sr-only">Processing</DialogDescription>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
              <div className="absolute inset-0 rounded-full radar-pulse"></div>
              <div className="w-20 h-20 bg-[#00b050] rounded-full flex items-center justify-center z-10 shadow-lg">
                <span className="text-white font-black text-xs tracking-widest">M-PESA</span>
              </div>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">AWAITING PIN</h2>
            <p className="text-zinc-400 font-medium">{mpesaStatusMessage}</p>
            <div className="mt-6 text-zinc-500 text-xs uppercase tracking-widest font-bold">
              Total: KSh {cartTotal.toLocaleString()}
            </div>
            <Button
              onClick={cancelMpesaPoll}
              variant="outline"
              className="mt-8 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-none uppercase tracking-widest text-[10px] font-bold h-10 px-6"
            >
              Cancel & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Mobile Money Prompt Modal */}
      <Dialog open={showMpesaPrompt} onOpenChange={setShowMpesaPrompt}>
        <DialogContent className="sm:max-w-md p-6 overflow-hidden border border-border bg-background shadow-lg rounded-3xl">
          <DialogDescription className="sr-only">Mobile Money Input</DialogDescription>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center font-black tracking-tighter text-xl">
                <span className="text-red-500">M-</span>
                <span className="text-green-600">PESA</span>
              </div>
              <div className="h-4 w-[1px] bg-border"></div>
              <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                Paystack &bull; {tillNumber ? 'TILL / PAYBILL' : 'MOBILE MONEY'}
              </span>
            </div>
            {tillNumber && (
              <div className="text-[10px] font-bold text-foreground tracking-widest uppercase bg-muted/50 px-2 py-1 rounded-md">
                NO: {tillNumber}
              </div>
            )}
          </div>

          <div className="mb-8">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Due</p>
             <div className="text-5xl font-black tracking-tighter text-foreground">
                <span className="text-2xl mr-1 text-muted-foreground font-semibold">KSh</span>{cartTotal.toLocaleString()}
             </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-widest">Customer Phone</p>
              <Input
                value={mpesaPhone}
                onChange={e => setMpesaPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                className="h-14 text-xl font-bold tracking-widest bg-transparent border-b-2 border-l-0 border-r-0 border-t-0 border-border focus-visible:border-foreground focus-visible:ring-0 rounded-none px-0 transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && mpesaPhone.length >= 9 && !mpesaLoading) {
                    handleMobileMoneyPay();
                  }
                }}
              />
            </div>
            
            {mpesaError && <p className="text-red-500 text-xs font-bold animate-in slide-in-from-top-1">{mpesaError}</p>}
            
            <Button 
              onClick={handleMobileMoneyPay} 
              disabled={mpesaPhone.length < 9 || mpesaLoading}
              className="w-full h-14 rounded-xl text-sm font-bold tracking-widest bg-foreground hover:bg-foreground/90 text-background transition-all"
            >
              {mpesaLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                  CONNECTING
                </span>
              ) : 'SEND PROMPT'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Paystack Success Modal */}
      <Dialog open={!!paymentSuccessData} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md border-0 bg-emerald-600 transition-colors duration-500">
          <DialogDescription className="sr-only">Success</DialogDescription>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="animate-in zoom-in-50 duration-300">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <span className="text-3xl font-black text-emerald-600">✓</span>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter mb-2">PAYMENT RECEIVED</h2>
              <p className="text-emerald-100 font-medium mb-1">Via {paymentSuccessData?.method}</p>
              <div className="inline-block bg-black/20 rounded-lg px-4 py-2 mt-4">
                <p className="text-emerald-50 text-sm font-mono tracking-widest">{paymentSuccessData?.receiptNumber}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal (Success) */}
      <Dialog open={showReceipt} onOpenChange={(open) => { if (!isPrinting) setShowReceipt(open); }}>
        <DialogContent className="sm:max-w-md print:max-w-full print:p-0 dark:border-border">
          <DialogDescription className="sr-only">Receipt</DialogDescription>
          <div
            className={cn("thermal-receipt mx-auto dark:bg-card dark:text-foreground", isPrinting ? "animate-pulse" : "")}
            style={{
              fontFamily: 'monospace',
              width: '58mm',
              minHeight: '120mm',
              // background: 'white', // Handled by class
              // color: 'black',      // Handled by class
              padding: '12px 0',
              border: '1px solid var(--border)',
              boxShadow: '0 0 0.5mm #ccc',
              margin: '0 auto',
              fontSize: '12px',
              letterSpacing: '0.01em',
              position: 'relative',
            }}
          >
            <div className="text-center mb-2">
              {bizLogo && (
                 <img src={bizLogo} alt={`${bizName} Logo`} style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain', margin: '0 auto 8px auto', display: 'block' }} />
              )}
              <div style={{ fontWeight: 'bold', fontSize: '1.1em' }} className="uppercase">{bizName}</div>
              <div>Ruiru</div>
              <div>Tel: {bizPhone}</div>
              <div>Receipt #: {lastSale?.id || Math.floor(Math.random()*1000000)}</div>
              <div>{new Date().toLocaleString()}</div>
              <div style={{ borderTop: '1px dashed #222', margin: '6px 0' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>Served by: <strong>{currentUser?.name ?? '—'}</strong></div>
              <div>Till: <strong>{tillNumber ?? '—'}</strong></div>
            </div>
            <table style={{ width: '100%', marginBottom: 6 }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #222' }}>
                  <th style={{ textAlign: 'left' }}>Item</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lastSale?.items?.map((item: any) => (
                  <tr key={item.product.id}>
                    <td style={{ textAlign: 'left', padding: '2px 0' }}>{item.product.name}</td>
                    <td style={{ textAlign: 'center', padding: '2px 0' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '2px 0' }}>{item.product.price.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', padding: '2px 0' }}>{(item.product.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ borderTop: '1px dashed #222', margin: '6px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>Subtotal</span>
              <span>KES {lastSale?.total?.toLocaleString() ?? cartTotal.toLocaleString()}</span>
            </div>
            {lastSale?.cashGiven !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>Cash Given</span>
                <span>KES {lastSale.cashGiven.toLocaleString()}</span>
              </div>
            )}
            {lastSale?.change !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontWeight: 'bold' }}>
                <span>Change</span>
                <span>KES {lastSale.change.toLocaleString()}</span>
              </div>
            )}
            {lastSale?.paymentMethod && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>Payment</span>
                <span>{lastSale.paymentMethod === 'mpesa' ? 'M-PESA' : 'CASH'}</span>
              </div>
            )}
            {lastSale?.mpesaRef && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>Ref</span>
                <span>{lastSale.mpesaRef}</span>
              </div>
            )}
            {lastSale?.customerPhone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>Payer</span>
                <span>{lastSale.customerPhone}</span>
              </div>
            )}
            <div className="text-center" style={{ marginTop: 8 }}>Thank you for shopping with us!</div>
            {/* Extra blank space for paper tear */}
            <div style={{ height: '40mm' }}></div>
            <div className="flex justify-center gap-2 pt-4 print:hidden">
              <Button variant="outline" onClick={() => setShowReceipt(false)}>Close</Button>
              <Button onClick={() => window.print()}>Print Receipt</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
    
    <Dialog open={!!paymentSuccessData} onOpenChange={(open) => !open && setPaymentSuccessData(null)}>
      <DialogContent className="sm:max-w-md rounded-none border-foreground/20 text-center p-8">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <DialogTitle className="text-2xl font-black uppercase tracking-widest mb-2">Payment Successful!</DialogTitle>
        <p className="text-muted-foreground mb-8">Transaction has been approved and recorded.</p>
        
        <div className="bg-muted/30 border border-foreground/10 p-6 text-left flex flex-col gap-4 mb-8">
          {lastSale?.customerPhone && (
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground uppercase text-xs tracking-widest">Customer Phone</span>
              <span className="font-bold">{lastSale.customerPhone}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span className="text-muted-foreground uppercase text-xs tracking-widest">Total Amount</span>
            <span className="font-bold">KES {lastSale?.total?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-muted-foreground uppercase text-xs tracking-widest">Amount Paid</span>
            <span className="font-bold text-green-500">KES {(lastSale?.cashGiven || lastSale?.total || 0).toLocaleString()}</span>
          </div>
          {lastSale?.paymentMethod === 'mpesa' && lastSale?.mpesaRef && (
            <div className="flex justify-between font-medium pt-3 border-t border-foreground/10 mt-1">
              <span className="text-muted-foreground uppercase text-xs tracking-widest">M-PESA Ref Code</span>
              <span className="font-mono font-black text-primary">{lastSale.mpesaRef}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              setPaymentSuccessData(null);
              triggerPrintAndReset();
            }} 
            className="flex-1 h-12 rounded-none font-bold uppercase tracking-widest"
          >
            Print Receipt
          </Button>
          <Button 
            onClick={() => {
              setPaymentSuccessData(null);
              clearCart();
            }} 
            className="flex-1 h-12 rounded-none font-bold uppercase tracking-widest"
          >
            Next Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    </div>
  );
};
