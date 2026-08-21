// ============================================================
// config/data.ts — Initial Data State & localStorage helpers
// Novex Pharma — مستودع الأدوية والتوزيع
// ============================================================

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  price: number;
  bonus: string;
  imageUrl: string;
  categories: string[];
  stock: number;
  description: string;
  barcode?: string;
  ratings: Rating[];
  stockMovements: StockMovement[];
  viewCount?: number;
}

export interface Rating {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface StockMovement {
  id: string;
  type: 'in' | 'out';
  quantity: number;
  note: string;
  timestamp: string;
}

export interface Pharmacy {
  id: string;
  pharmacyName: string;
  username: string;
  password: string;
  phone: string;
  accountType: "pharmacy" | "admin";
  totalDebt: number;
  totalPaid: number;
  registeredAt: string;
  messages: Message[];
  lastPaymentReminder?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface CartItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  bonus: string;
}

export interface Receipt {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  amount: number;
  imageUrl: string;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
  notes: string;
}

export interface Order {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  items: CartItem[];
  total: number;
  timestamp: string;
  status: "pending" | "delivered";
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

// ─── Default seed data ───────────────────────────────────────

const DEFAULT_MEDICINES: Medicine[] = [
  {
    id: "med-001",
    name: "أموكسيسيلين 500 مجم",
    genericName: "Amoxicillin 500mg",
    price: 18.5,
    bonus: "1+11",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop",
    categories: ["مضادات حيوية"],
    stock: 500,
    description: "مضاد حيوي واسع الطيف لعلاج الالتهابات البكتيرية",
    barcode: "1234567890123",
    ratings: [],
    stockMovements: [],
    viewCount: 0,
  },
  {
    id: "med-002",
    name: "باراسيتامول 500 مجم",
    genericName: "Paracetamol 500mg",
    price: 8.0,
    bonus: "2+10",
    imageUrl: "https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=300&h=200&fit=crop",
    categories: ["مسكنات"],
    stock: 1200,
    description: "مسكن للألم وخافض للحرارة",
    barcode: "1234567890124",
    ratings: [],
    stockMovements: [],
    viewCount: 0,
  },
  {
    id: "med-003",
    name: "أوميبرازول 20 مجم",
    genericName: "Omeprazole 20mg",
    price: 22.0,
    bonus: "1+9",
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop",
    categories: ["الجهاز الهضمي"],
    stock: 800,
    description: "مثبط مضخة البروتون لعلاج الحموضة والقرحة",
    barcode: "1234567890125",
    ratings: [],
    stockMovements: [],
    viewCount: 0,
  },
  {
    id: "med-004",
    name: "ميتفورمين 850 مجم",
    genericName: "Metformin 850mg",
    price: 15.0,
    bonus: "1+11",
    imageUrl: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&h=200&fit=crop",
    categories: ["السكري"],
    stock: 600,
    description: "دواء مضاد لمرض السكري من النوع الثاني",
    barcode: "1234567890126",
    ratings: [],
    stockMovements: [],
    viewCount: 0,
  },
  {
    id: "med-005",
    name: "أتورفاستاتين 20 مجم",
    genericName: "Atorvastatin 20mg",
    price: 35.0,
    bonus: "1+5",
    imageUrl: "https://images.unsplash.com/photo-1563213126-a4273aed2016?w=300&h=200&fit=crop",
    categories: ["القلب والأوعية"],
    stock: 400,
    description: "خافض للكوليسترول من مجموعة الستاتينات",
    barcode: "1234567890127",
    ratings: [],
    stockMovements: [],
    viewCount: 0,
  },
  {
    id: "med-006",
    name: "سيتيريزين 10 مجم",
    genericName: "Cetirizine 10mg",
    price: 12.0,
    bonus: "2+8",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop",
    categories: ["مضادات الحساسية"],
    stock: 900,
    description: "مضاد للهيستامين لعلاج الحساسية والتهاب الأنف التحسسي",
    barcode: "1234567890128",
    ratings: [],
    stockMovements: [],
    viewCount: 0,
  },
  {
    id: "med-007",
    name: "أزيثروميسين 250 مجم",
    genericName: "Azithromycin 250mg",
    price: 42.0,
    bonus: "1+5",
    imageUrl: "https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=300&h=200&fit=crop",
    categories: ["مضادات حيوية"],
    stock: 350,
    description: "مضاد حيوي ماكرولايد لعلاج التهابات الجهاز التنفسي",
    barcode: "1234567890129",
    ratings: [],
    stockMovements: [],
    viewCount: 0,
  },
  {
    id: "med-008",
    name: "إيبوبروفين 400 مجم",
    genericName: "Ibuprofen 400mg",
    price: 10.5,
    bonus: "2+10",
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop",
    categories: ["مسكنات"],
    stock: 1100,
    description: "مسكن ألم ومضاد للالتهاب غير ستيرويدي",
    barcode: "1234567890130",
    ratings: [],
    stockMovements: [],
    viewCount: 0,
  },
  {
    id: "med-009",
    name: "لوسارتان 50 مجم",
    genericName: "Losartan 50mg",
    price: 28.0,
    bonus: "1+9",
    imageUrl: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&h=200&fit=crop",
    categories: ["القلب والأوعية"],
    stock: 550,
    description: "مضاد لمستقبلات الأنجيوتنسين لعلاج ارتفاع ضغط الدم",
    barcode: "1234567890131",
    ratings: [],
    stockMovements: [],
    viewCount: 0,
  },
  {
    id: "med-010",
    name: "فيتامين D3 1000 وحدة",
    genericName: "Vitamin D3 1000 IU",
    price: 32.0,
    bonus: "1+11",
    imageUrl: "https://images.unsplash.com/photo-1563213126-a4273aed2016?w=300&h=200&fit=crop",
    categories: ["فيتامينات ومكملات"],
    stock: 700,
    description: "مكمل غذائي لتعويض نقص فيتامين د",
    barcode: "1234567890132",
    ratings: [],
    stockMovements: [],
    viewCount: 0,
  },
  {
    id: "med-011",
    name: "كلاريثروميسين 500 مجم",
    genericName: "Clarithromycin 500mg",
    price: 55.0,
    bonus: "1+7",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop",
    categories: ["مضادات حيوية"],
    stock: 280,
    description: "مضاد حيوي ماكرولايد لعلاج الالتهابات البكتيرية",
    barcode: "1234567890133",
    ratings: [],
    stockMovements: [],
    viewCount: 0,
  },
  {
    id: "med-012",
    name: "ديكلوفيناك 50 مجم",
    genericName: "Diclofenac 50mg",
    price: 14.0,
    bonus: "2+8",
    imageUrl: "https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=300&h=200&fit=crop",
    categories: ["مسكنات"],
    stock: 850,
    description: "مضاد التهاب غير ستيرويدي لعلاج آلام المفاصل",
    barcode: "1234567890134",
    ratings: [],
    stockMovements: [],
    viewCount: 0,
  },
];

const DEFAULT_PHARMACIES: Pharmacy[] = [
  {
    id: "pharm-001",
    pharmacyName: "صيدلية النور",
    username: "alnoor",
    password: "123456",
    phone: "0599111222",
    accountType: "pharmacy",
    totalDebt: 2850.0,
    totalPaid: 1200.0,
    registeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [],
    lastPaymentReminder: undefined,
  },
  {
    id: "pharm-002",
    pharmacyName: "صيدلية الشفاء",
    username: "alshifa",
    password: "123456",
    phone: "0598333444",
    accountType: "pharmacy",
    totalDebt: 5400.0,
    totalPaid: 3100.0,
    registeredAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [],
    lastPaymentReminder: undefined,
  },
  {
    id: "pharm-003",
    pharmacyName: "صيدلية الرحمة",
    username: "alrahma",
    password: "123456",
    phone: "0597555666",
    accountType: "pharmacy",
    totalDebt: 1750.0,
    totalPaid: 800.0,
    registeredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [],
    lastPaymentReminder: undefined,
  },
];

const DEFAULT_RECEIPTS: Receipt[] = [
  {
    id: "rec-001",
    pharmacyId: "pharm-001",
    pharmacyName: "صيدلية النور",
    amount: 500.0,
    imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "approved",
    notes: "تحويل بنكي - حساب الشركة",
  },
  {
    id: "rec-002",
    pharmacyId: "pharm-001",
    pharmacyName: "صيدلية النور",
    amount: 700.0,
    imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    notes: "تحويل عبر التطبيق",
  },
  {
    id: "rec-003",
    pharmacyId: "pharm-002",
    pharmacyName: "صيدلية الشفاء",
    amount: 1500.0,
    imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "approved",
    notes: "شيك مصرفي",
  },
  {
    id: "rec-004",
    pharmacyId: "pharm-002",
    pharmacyName: "صيدلية الشفاء",
    amount: 1600.0,
    imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    notes: "تحويل بنكي عاجل",
  },
  {
    id: "rec-005",
    pharmacyId: "pharm-003",
    pharmacyName: "صيدلية الرحمة",
    amount: 800.0,
    imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    notes: "دفع نقدي - تصوير الإيصال",
  },
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "ord-001",
    pharmacyId: "pharm-001",
    pharmacyName: "صيدلية النور",
    items: [
      { medicineId: "med-001", medicineName: "أموكسيسيلين 500 مجم", genericName: "Amoxicillin 500mg", price: 18.5, quantity: 50, bonus: "1+11", originalPrice: 18.5 },
      { medicineId: "med-002", medicineName: "باراسيتامول 500 مجم", genericName: "Paracetamol 500mg", price: 8.0, quantity: 100, bonus: "2+10", originalPrice: 8.0 },
    ],
    total: 1725.0,
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: "delivered",
  },
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-001",
    message: "تم إضافة عرض جديد على أموكسيسيلين 500 مجم",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    type: "info",
  },
  {
    id: "notif-002",
    message: "تم الموافقة على الإيصال المرسل - 500 ₪",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
    type: "success",
  },
  {
    id: "notif-003",
    message: "موعد السداد القادم: الأسبوع القادم",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true,
    type: "warning",
  },
];

// ─── localStorage Keys ────────────────────────────────────────
export const STORAGE_KEYS = {
  MEDICINES: "novex_medicines",
  PHARMACIES: "novex_pharmacies",
  RECEIPTS: "novex_receipts",
  ORDERS: "novex_orders",
  NOTIFICATIONS: "novex_notifications",
  CURRENT_USER: "novex_current_user",
  CART: "novex_cart",
} as const;

// ─── Storage helpers ──────────────────────────────────────────
export function initializeStorage(): void {
  const existing = localStorage.getItem(STORAGE_KEYS.MEDICINES);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      const upgraded = parsed.map((m: any) => ({
        ...m,
        ratings: m.ratings || [],
        stockMovements: m.stockMovements || [],
        barcode: m.barcode || '',
        categories: m.categories || (m.category ? [m.category] : []),
        viewCount: m.viewCount !== undefined ? m.viewCount : 0,
        category: undefined,
      }));
      localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(upgraded));
    } catch (e) {
      localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(DEFAULT_MEDICINES));
    }
  } else {
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(DEFAULT_MEDICINES));
  }

  const pharmExisting = localStorage.getItem(STORAGE_KEYS.PHARMACIES);
  if (pharmExisting) {
    try {
      const parsed = JSON.parse(pharmExisting);
      const upgraded = parsed.map((p: any) => ({
        ...p,
        messages: p.messages || [],
        lastPaymentReminder: p.lastPaymentReminder || undefined,
      }));
      localStorage.setItem(STORAGE_KEYS.PHARMACIES, JSON.stringify(upgraded));
    } catch (e) {
      localStorage.setItem(STORAGE_KEYS.PHARMACIES, JSON.stringify(DEFAULT_PHARMACIES));
    }
  } else {
    localStorage.setItem(STORAGE_KEYS.PHARMACIES, JSON.stringify(DEFAULT_PHARMACIES));
  }

  if (!localStorage.getItem(STORAGE_KEYS.RECEIPTS)) {
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(DEFAULT_RECEIPTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
  }
}

export function getMedicines(): Medicine[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICINES) || "[]");
}

export function setMedicines(medicines: Medicine[]): void {
  localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
}

export function getPharmacies(): Pharmacy[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PHARMACIES) || "[]");
}

export function setPharmacies(pharmacies: Pharmacy[]): void {
  localStorage.setItem(STORAGE_KEYS.PHARMACIES, JSON.stringify(pharmacies));
}

export function getReceipts(): Receipt[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || "[]");
}

export function setReceipts(receipts: Receipt[]): void {
  localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
}

export function getOrders(): Order[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]");
}

export function setOrders(orders: Order[]): void {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

export function getNotifications(): Notification[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || "[]");
}

export function setNotifications(notifications: Notification[]): void {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
}

export function getCart(): CartItem[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || "[]");
}

export function setCart(cart: CartItem[]): void {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
}

export function getCurrentUser(): Pharmacy | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function setCurrentUser(user: Pharmacy | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪`;
}

// ─── Browser Notification ─────────────────────────────────────
export function sendBrowserNotification(title: string, body: string, icon?: string) {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return;
  }
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body: body,
        icon: icon || '/logo.png',
        silent: false,
      });
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        sendBrowserNotification(title, body, icon);
      }
    });
  } else {
    console.warn('Notifications blocked by user');
  }
}

// ─── دوال جديدة ──────────────────────────────────────────────

export function getLowStockMedicines(threshold: number = 50): Medicine[] {
  return getMedicines().filter(m => m.stock < threshold);
}

export function addStockMovement(
  medicineId: string,
  type: 'in' | 'out',
  quantity: number,
  note: string = ''
): void {
  const medicines = getMedicines();
  const index = medicines.findIndex(m => m.id === medicineId);
  if (index === -1) return;
  const movement: StockMovement = {
    id: generateId('mov'),
    type,
    quantity,
    note,
    timestamp: new Date().toISOString(),
  };
  medicines[index].stockMovements.push(movement);
  medicines[index].stock += type === 'in' ? quantity : -quantity;
  if (medicines[index].stock < 0) medicines[index].stock = 0;
  setMedicines(medicines);
}

export function addRating(
  medicineId: string,
  userId: string,
  userName: string,
  rating: number,
  comment: string
): void {
  const medicines = getMedicines();
  const index = medicines.findIndex(m => m.id === medicineId);
  if (index === -1) return;
  const newRating: Rating = {
    userId,
    userName,
    rating,
    comment,
    timestamp: new Date().toISOString(),
  };
  medicines[index].ratings.push(newRating);
  setMedicines(medicines);
}

export function getMedicineAverageRating(medicineId: string): number {
  const med = getMedicines().find(m => m.id === medicineId);
  if (!med || med.ratings.length === 0) return 0;
  const sum = med.ratings.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / med.ratings.length) * 10) / 10;
}

export function sendMessage(pharmacyId: string, senderId: string, senderName: string, text: string): void {
  const pharmacies = getPharmacies();
  const index = pharmacies.findIndex(p => p.id === pharmacyId);
  if (index === -1) return;
  const newMessage: Message = {
    id: generateId('msg'),
    senderId,
    senderName,
    text,
    timestamp: new Date().toISOString(),
    read: false,
  };
  pharmacies[index].messages.push(newMessage);
  setPharmacies(pharmacies);
}

export function getMessages(pharmacyId: string): Message[] {
  const pharmacies = getPharmacies();
  const pharm = pharmacies.find(p => p.id === pharmacyId);
  return pharm?.messages || [];
}

export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

// ─── دالة addNotification ──────────────────────────────────────
export function addNotification(message: string, type: "info" | "success" | "warning" = "info"): void {
  const notifications = getNotifications();
  const newNotification: Notification = {
    id: generateId("notif"),
    message,
    timestamp: new Date().toISOString(),
    read: false,
    type,
  };
  setNotifications([newNotification, ...notifications]);
}

// ─── دوال البونص (معدلة بشكل صحيح) ──────────────────────────
export function parseBonus(bonus: string): { paid: number; free: number } | null {
  if (!bonus) return null;
  const parts = bonus.split('+');
  if (parts.length !== 2) return null;
  const paid = parseInt(parts[0]);
  const free = parseInt(parts[1]);
  if (isNaN(paid) || isNaN(free)) return null;
  return { paid, free };
}

export function getDiscountedPrice(originalPrice: number, bonus: string, quantity: number): number {
  const parsed = parseBonus(bonus);
  if (!parsed) return originalPrice;
  const { paid, free } = parsed;
  if (paid === 0) return originalPrice;

  const totalUnitPerGroup = paid + free;
  const fullGroups = Math.floor(quantity / totalUnitPerGroup);
  const remainder = quantity % totalUnitPerGroup;
  const paidUnits = (fullGroups * paid) + Math.min(remainder, paid);
  const totalDiscounted = paidUnits * originalPrice;
  return totalDiscounted / quantity;
}

export function getSavings(originalPrice: number, bonus: string, quantity: number): number {
  const discountedPrice = getDiscountedPrice(originalPrice, bonus, quantity);
  return (originalPrice - discountedPrice) * quantity;
}

// ─── دوال المخزون ──────────────────────────────────────────────
export function updateStockAfterOrder(order: Order): void {
  const medicines = getMedicines();
  order.items.forEach(item => {
    const index = medicines.findIndex(m => m.id === item.medicineId);
    if (index !== -1) {
      medicines[index].stock -= item.quantity;
      if (medicines[index].stock < 0) medicines[index].stock = 0;
    }
  });
  setMedicines(medicines);
}

// ─── دوال الصيدلية ─────────────────────────────────────────────
export function updatePharmacy(pharmacyId: string, updates: Partial<Pharmacy>): boolean {
  const pharmacies = getPharmacies();
  const index = pharmacies.findIndex(p => p.id === pharmacyId);
  if (index === -1) return false;
  pharmacies[index] = { ...pharmacies[index], ...updates };
  setPharmacies(pharmacies);
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === pharmacyId) {
    setCurrentUser(pharmacies[index]);
  }
  return true;
}

export function resetPharmacyPassword(pharmacyId: string, newPassword: string): boolean {
  if (newPassword.length < 6) return false;
  const pharmacies = getPharmacies();
  const index = pharmacies.findIndex(p => p.id === pharmacyId);
  if (index === -1) return false;
  pharmacies[index].password = newPassword;
  setPharmacies(pharmacies);
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === pharmacyId) {
    setCurrentUser(pharmacies[index]);
  }
  return true;
}

// ─── دالة إعادة حساب الدين تلقائياً ──────────────────────────
export function recalculatePharmacyDebt(pharmacyId: string): void {
  const receipts = getReceipts().filter(r => r.pharmacyId === pharmacyId && r.status === 'approved');
  const totalPaid = receipts.reduce((sum, r) => sum + r.amount, 0);
  
  const orders = getOrders().filter(o => o.pharmacyId === pharmacyId);
  const totalPurchases = orders.reduce((sum, o) => sum + o.total, 0);
  
  const pharmacies = getPharmacies();
  const index = pharmacies.findIndex(p => p.id === pharmacyId);
  if (index === -1) return;
  
  pharmacies[index].totalPaid = totalPaid;
  pharmacies[index].totalDebt = Math.max(0, totalPurchases - totalPaid);
  setPharmacies(pharmacies);
  
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === pharmacyId) {
    setCurrentUser(pharmacies[index]);
  }
}
