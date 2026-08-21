// ============================================================
// components/StockAlert.tsx — Stock alerts for admin
// ============================================================
import { useState, useEffect } from 'react';
import { getLowStockMedicines, Medicine } from '../config/data';

interface StockAlertProps {
  onNavigate?: (page: string, params?: Record<string, string>) => void;
}

export default function StockAlert({ onNavigate }: StockAlertProps) {
  const [lowStock, setLowStock] = useState<Medicine[]>([]);
  const [threshold, setThreshold] = useState(50);

  useEffect(() => {
    setLowStock(getLowStockMedicines(threshold));
  }, [threshold]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">⚠️ تنبيهات المخزون المنخفض</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">الحد الأدنى:</label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 50))}
            className="w-16 px-2 py-1 border border-slate-300 rounded text-sm"
          />
        </div>
      </div>
      {lowStock.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          ✅ جميع الأدوية ضمن الحد الآمن
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {lowStock.map((med) => (
            <div key={med.id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <img src={med.imageUrl} alt={med.name} className="w-10 h-10 rounded-lg object-cover" />
                <div>
                  <div className="font-semibold text-sm text-slate-800">{med.name}</div>
                  <div className="text-xs text-slate-500">{med.genericName}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-red-600 text-sm">{med.stock} وحدة</div>
                <button
                  onClick={() => onNavigate?.('products')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  إدارة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}