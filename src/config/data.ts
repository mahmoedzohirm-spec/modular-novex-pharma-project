// ============================================================
// config/data.ts — Data Layer (Neon Database + localStorage)
// Novex Pharma — مستودع الأدوية والتوزيع
// ============================================================
import { sql } from './db';
import bcrypt from 'bcryptjs';

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

// ─── localStorage Keys (للسلة والمستخدم الحالي فقط) ───
export const STORAGE_KEYS = {
  CART: "novex_cart",
  CURRENT_USER: "novex_current_user",
} as const;

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

const DEFAULT_PHARMACIES: Omit<Pharmacy, 'messages' | 'lastPaymentReminder'>[] = [
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

// ─── دوال التهيئة ──────────────────────────────────────────────
export async function initializeStorage(): Promise<void> {
  // التحقق من وجود أدوية
  const medicines = await getMedicines();
  if (medicines.length === 0) {
    for (const med of DEFAULT_MEDICINES) {
      await sql`
        INSERT INTO medicines (
          id, name, genericname, price, bonus, imageurl,
          categories, stock, description, barcode, ratings, stockmovements, viewcount
        ) VALUES (
          ${med.id}, ${med.name}, ${med.genericName}, ${med.price}, ${med.bonus},
          ${med.imageUrl}, ${med.categories}, ${med.stock}, ${med.description},
          ${med.barcode}, ${med.ratings}, ${med.stockMovements}, ${med.viewCount}
        );
      `;
    }
  }

  // التحقق من وجود صيدليات
  const pharmacies = await getPharmacies();
  if (pharmacies.length === 0) {
    for (const p of DEFAULT_PHARMACIES) {
      await sql`
        INSERT INTO pharmacies (
          id, pharmacyname, username, password, phone, accounttype,
          totaldebt, totalpaid, registeredat, messages, lastpaymentreminder
        ) VALUES (
          ${p.id}, ${p.pharmacyName}, ${p.username}, ${p.password}, ${p.phone},
          ${p.accountType}, ${p.totalDebt}, ${p.totalPaid}, ${p.registeredAt},
          '[]', NULL
        );
      `;
    }
  }

  // التحقق من وجود إيصالات
  const receipts = await getReceipts();
  if (receipts.length === 0) {
    for (const r of DEFAULT_RECEIPTS) {
      await sql`
        INSERT INTO receipts (
          id, pharmacyid, pharmacyname, amount, imageurl,
          timestamp, status, notes
        ) VALUES (
          ${r.id}, ${r.pharmacyId}, ${r.pharmacyName}, ${r.amount},
          ${r.imageUrl}, ${r.timestamp}, ${r.status}, ${r.notes}
        );
      `;
    }
  }

  // التحقق من وجود طلبات
  const orders = await getOrders();
  if (orders.length === 0) {
    for (const o of DEFAULT_ORDERS) {
      await sql`
        INSERT INTO orders (
          id, pharmacyid, pharmacyname, items, total,
          timestamp, status
        ) VALUES (
          ${o.id}, ${o.pharmacyId}, ${o.pharmacyName}, ${o.items},
          ${o.total}, ${o.timestamp}, ${o.status}
        );
      `;
    }
  }

  // التحقق من وجود إشعارات
  const notifications = await getNotifications();
  if (notifications.length === 0) {
    for (const n of DEFAULT_NOTIFICATIONS) {
      await sql`
        INSERT INTO notifications (id, message, timestamp, read, type)
        VALUES (${n.id}, ${n.message}, ${n.timestamp}, ${n.read}, ${n.type});
      `;
    }
  }
}

// ─── دوال الأدوية ──────────────────────────────────────────────
export async function getMedicines(): Promise<Medicine[]> {
  const result = await sql`SELECT * FROM medicines ORDER BY name;`;
  return result.map((r: any) => ({
    id: r.id,
    name: r.name,
    genericName: r.genericname,
    price: r.price,
    bonus: r.bonus,
    imageUrl: r.imageurl,
    categories: r.categories || [],
    stock: r.stock,
    description: r.description,
    barcode: r.barcode,
    ratings: r.ratings || [],
    stockMovements: r.stockmovements || [],
    viewCount: r.viewcount || 0,
  }));
}

export async function setMedicines(medicines: Medicine[]): Promise<void> {
  await sql`DELETE FROM medicines;`;
  for (const med of medicines) {
    await sql`
      INSERT INTO medicines (
        id, name, genericname, price, bonus, imageurl, 
        categories, stock, description, barcode, ratings, stockmovements, viewcount
      ) VALUES (
        ${med.id}, ${med.name}, ${med.genericName}, ${med.price}, ${med.bonus},
        ${med.imageUrl}, ${med.categories}, ${med.stock}, ${med.description},
        ${med.barcode}, ${med.ratings}, ${med.stockMovements}, ${med.viewCount || 0}
      );
    `;
  }
}

export async function getMedicineById(id: string): Promise<Medicine | null> {
  const result = await sql`SELECT * FROM medicines WHERE id = ${id};`;
  if (result.length === 0) return null;
  const r = result[0];
  return {
    id: r.id,
    name: r.name,
    genericName: r.genericname,
    price: r.price,
    bonus: r.bonus,
    imageUrl: r.imageurl,
    categories: r.categories || [],
    stock: r.stock,
    description: r.description,
    barcode: r.barcode,
    ratings: r.ratings || [],
    stockMovements: r.stockmovements || [],
    viewCount: r.viewcount || 0,
  };
}

export async function getLowStockMedicines(threshold: number = 50): Promise<Medicine[]> {
  const medicines = await getMedicines();
  return medicines.filter(m => m.stock < threshold);
}

export async function addStockMovement(
  medicineId: string,
  type: 'in' | 'out',
  quantity: number,
  note: string = ''
): Promise<void> {
  const medicines = await getMedicines();
  const med = medicines.find(m => m.id === medicineId);
  if (!med) return;
  
  const movement: StockMovement = {
    id: generateId('mov'),
    type,
    quantity,
    note,
    timestamp: new Date().toISOString(),
  };
  
  med.stockMovements.push(movement);
  med.stock += type === 'in' ? quantity : -quantity;
  if (med.stock < 0) med.stock = 0;
  await setMedicines(medicines);
}

export async function updateStockAfterOrder(order: Order): Promise<void> {
  const medicines = await getMedicines();
  order.items.forEach(item => {
    const med = medicines.find(m => m.id === item.medicineId);
    if (med) {
      med.stock -= item.quantity;
      if (med.stock < 0) med.stock = 0;
    }
  });
  await setMedicines(medicines);
}

// ─── دوال الصيدليات ────────────────────────────────────────────
export async function getPharmacies(): Promise<Pharmacy[]> {
  const result = await sql`SELECT * FROM pharmacies ORDER BY pharmacyname;`;
  return result.map((r: any) => ({
    id: r.id,
    pharmacyName: r.pharmacyname,
    username: r.username,
    password: r.password,
    phone: r.phone,
    accountType: r.accounttype,
    totalDebt: r.totaldebt || 0,
    totalPaid: r.totalpaid || 0,
    registeredAt: r.registeredat,
    messages: r.messages || [],
    lastPaymentReminder: r.lastpaymentreminder,
  }));
}

export async function setPharmacies(pharmacies: Pharmacy[]): Promise<void> {
  await sql`DELETE FROM pharmacies;`;
  for (const p of pharmacies) {
    await sql`
      INSERT INTO pharmacies (
        id, pharmacyname, username, password, phone, accounttype,
        totaldebt, totalpaid, registeredat, messages, lastpaymentreminder
      ) VALUES (
        ${p.id}, ${p.pharmacyName}, ${p.username}, ${p.password}, ${p.phone},
        ${p.accountType}, ${p.totalDebt}, ${p.totalPaid}, ${p.registeredAt},
        ${p.messages}, ${p.lastPaymentReminder}
      );
    `;
  }
}

export async function getPharmacyByUsername(username: string): Promise<Pharmacy | null> {
  const result = await sql`SELECT * FROM pharmacies WHERE username = ${username};`;
  if (result.length === 0) return null;
  const r = result[0];
  return {
    id: r.id,
    pharmacyName: r.pharmacyname,
    username: r.username,
    password: r.password,
    phone: r.phone,
    accountType: r.accounttype,
    totalDebt: r.totaldebt || 0,
    totalPaid: r.totalpaid || 0,
    registeredAt: r.registeredat,
    messages: r.messages || [],
    lastPaymentReminder: r.lastpaymentreminder,
  };
}

export async function updatePharmacy(pharmacyId: string, updates: Partial<Pharmacy>): Promise<boolean> {
  const pharmacies = await getPharmacies();
  const index = pharmacies.findIndex(p => p.id === pharmacyId);
  if (index === -1) return false;
  
  const updated = { ...pharmacies[index], ...updates };
  pharmacies[index] = updated;
  await setPharmacies(pharmacies);
  
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === pharmacyId) {
    setCurrentUser(updated);
  }
  return true;
}

export async function resetPharmacyPassword(pharmacyId: string, newPassword: string): Promise<boolean> {
  if (newPassword.length < 6) return false;
  const hashed = await hashPassword(newPassword);
  return updatePharmacy(pharmacyId, { password: hashed });
}

export async function sendMessage(pharmacyId: string, senderId: string, senderName: string, text: string): Promise<void> {
  const pharmacies = await getPharmacies();
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
  await setPharmacies(pharmacies);
}

export async function getMessages(pharmacyId: string): Promise<Message[]> {
  const pharmacies = await getPharmacies();
  const pharm = pharmacies.find(p => p.id === pharmacyId);
  return pharm?.messages || [];
}

// ─── دوال الإيصالات ────────────────────────────────────────────
export async function getReceipts(): Promise<Receipt[]> {
  const result = await sql`SELECT * FROM receipts ORDER BY timestamp DESC;`;
  return result.map((r: any) => ({
    id: r.id,
    pharmacyId: r.pharmacyid,
    pharmacyName: r.pharmacyname,
    amount: r.amount,
    imageUrl: r.imageurl,
    timestamp: r.timestamp,
    status: r.status,
    notes: r.notes,
  }));
}

export async function setReceipts(receipts: Receipt[]): Promise<void> {
  await sql`DELETE FROM receipts;`;
  for (const r of receipts) {
    await sql`
      INSERT INTO receipts (
        id, pharmacyid, pharmacyname, amount, imageurl,
        timestamp, status, notes
      ) VALUES (
        ${r.id}, ${r.pharmacyId}, ${r.pharmacyName}, ${r.amount},
        ${r.imageUrl}, ${r.timestamp}, ${r.status}, ${r.notes}
      );
    `;
  }
}

export async function addReceipt(receipt: Receipt): Promise<void> {
  await sql`
    INSERT INTO receipts (
      id, pharmacyid, pharmacyname, amount, imageurl,
      timestamp, status, notes
    ) VALUES (
      ${receipt.id}, ${receipt.pharmacyId}, ${receipt.pharmacyName},
      ${receipt.amount}, ${receipt.imageUrl}, ${receipt.timestamp},
      ${receipt.status}, ${receipt.notes}
    );
  `;
}

export async function updateReceiptStatus(receiptId: string, status: 'approved' | 'rejected'): Promise<void> {
  await sql`UPDATE receipts SET status = ${status} WHERE id = ${receiptId};`;
}

// ─── دوال الطلبات ──────────────────────────────────────────────
export async function getOrders(): Promise<Order[]> {
  const result = await sql`SELECT * FROM orders ORDER BY timestamp DESC;`;
  return result.map((r: any) => ({
    id: r.id,
    pharmacyId: r.pharmacyid,
    pharmacyName: r.pharmacyname,
    items: r.items || [],
    total: r.total,
    timestamp: r.timestamp,
    status: r.status,
  }));
}

export async function setOrders(orders: Order[]): Promise<void> {
  await sql`DELETE FROM orders;`;
  for (const o of orders) {
    await sql`
      INSERT INTO orders (
        id, pharmacyid, pharmacyname, items, total,
        timestamp, status
      ) VALUES (
        ${o.id}, ${o.pharmacyId}, ${o.pharmacyName}, ${o.items},
        ${o.total}, ${o.timestamp}, ${o.status}
      );
    `;
  }
}

export async function addOrder(order: Order): Promise<void> {
  await sql`
    INSERT INTO orders (
      id, pharmacyid, pharmacyname, items, total,
      timestamp, status
    ) VALUES (
      ${order.id}, ${order.pharmacyId}, ${order.pharmacyName},
      ${order.items}, ${order.total}, ${order.timestamp}, ${order.status}
    );
  `;
}

// ─── دوال الإشعارات ────────────────────────────────────────────
export async function getNotifications(): Promise<Notification[]> {
  const result = await sql`SELECT * FROM notifications ORDER BY timestamp DESC;`;
  return result.map((r: any) => ({
    id: r.id,
    message: r.message,
    timestamp: r.timestamp,
    read: r.read || false,
    type: r.type || 'info',
  }));
}

export async function setNotifications(notifications: Notification[]): Promise<void> {
  await sql`DELETE FROM notifications;`;
  for (const n of notifications) {
    await sql`
      INSERT INTO notifications (id, message, timestamp, read, type)
      VALUES (${n.id}, ${n.message}, ${n.timestamp}, ${n.read}, ${n.type});
    `;
  }
}

export async function addNotification(message: string, type: "info" | "success" | "warning" = "info"): Promise<void> {
  const id = generateId("notif");
  await sql`
    INSERT INTO notifications (id, message, timestamp, read, type)
    VALUES (${id}, ${message}, NOW(), false, ${type});
  `;
}

// ─── دوال المصادقة ────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function login(username: string, password: string): Promise<{ success: boolean; message: string; isAdmin: boolean; user?: Pharmacy }> {
  const user = await getPharmacyByUsername(username);
  if (!user) {
    return { success: false, message: 'اسم المستخدم غير موجود', isAdmin: false };
  }
  
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return { success: false, message: 'كلمة المرور غير صحيحة', isAdmin: false };
  }
  
  setCurrentUser(user);
  
  return {
    success: true,
    message: `مرحباً بك، ${user.pharmacyName}`,
    isAdmin: user.accountType === 'admin',
    user,
  };
}

export async function register(data: {
  pharmacyName: string;
  username: string;
  password: string;
  phone: string;
  accountType: "pharmacy";
}): Promise<{ success: boolean; message: string }> {
  // التحقق من وجود اسم المستخدم
  const existing = await getPharmacyByUsername(data.username);
  if (existing) {
    return { success: false, message: 'اسم المستخدم مستخدم بالفعل' };
  }
  
  // تشفير كلمة المرور
  const hashedPassword = await hashPassword(data.password);
  
  const newPharmacy: Pharmacy = {
    id: generateId('pharm'),
    pharmacyName: data.pharmacyName,
    username: data.username,
    password: hashedPassword,
    phone: data.phone,
    accountType: data.accountType,
    totalDebt: 0,
    totalPaid: 0,
    registeredAt: new Date().toISOString(),
    messages: [],
  };
  
  const pharmacies = await getPharmacies();
  pharmacies.push(newPharmacy);
  await setPharmacies(pharmacies);
  
  setCurrentUser(newPharmacy);
  
  return {
    success: true,
    message: `تم إنشاء الحساب بنجاح! مرحباً بك، ${newPharmacy.pharmacyName}`,
  };
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// ─── دوال السلة (تظل في localStorage) ────────────────────────
export function getCart(): CartItem[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || "[]");
}

export function setCart(cart: CartItem[]): void {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
}

// ─── دوال المستخدم الحالي (تظل في localStorage) ──────────────
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

// ─── دوال إعادة حساب الدين ────────────────────────────────────
export async function recalculatePharmacyDebt(pharmacyId: string): Promise<void> {
  const receipts = await getReceipts();
  const approved = receipts.filter(r => r.pharmacyId === pharmacyId && r.status === 'approved');
  const totalPaid = approved.reduce((sum, r) => sum + r.amount, 0);
  
  const orders = await getOrders();
  const pharmacyOrders = orders.filter(o => o.pharmacyId === pharmacyId);
  const totalPurchases = pharmacyOrders.reduce((sum, o) => sum + o.total, 0);
  
  const pharmacies = await getPharmacies();
  const index = pharmacies.findIndex(p => p.id === pharmacyId);
  if (index === -1) return;
  
  pharmacies[index].totalPaid = totalPaid;
  pharmacies[index].totalDebt = Math.max(0, totalPurchases - totalPaid);
  await setPharmacies(pharmacies);
  
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === pharmacyId) {
    setCurrentUser(pharmacies[index]);
  }
}

// ─── دوال التقييم ──────────────────────────────────────────────
export async function addRating(
  medicineId: string,
  userId: string,
  userName: string,
  rating: number,
  comment: string
): Promise<void> {
  const medicines = await getMedicines();
  const med = medicines.find(m => m.id === medicineId);
  if (!med) return;
  
  const newRating: Rating = {
    userId,
    userName,
    rating,
    comment,
    timestamp: new Date().toISOString(),
  };
  
  med.ratings.push(newRating);
  await setMedicines(medicines);
}

export async function getMedicineAverageRating(medicineId: string): Promise<number> {
  const med = await getMedicineById(medicineId);
  if (!med || med.ratings.length === 0) return 0;
  const sum = med.ratings.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / med.ratings.length) * 10) / 10;
}

// ─── دوال مساعدة ──────────────────────────────────────────────
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

// ─── دوال البونص ──────────────────────────────────────────────
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
