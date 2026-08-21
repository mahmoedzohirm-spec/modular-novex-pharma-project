// ============================================================
// components/BarcodeScanner.tsx — Barcode Scanner with camera toggle
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const isActive = useRef(true);

  // جلب قائمة الكاميرات
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          setError('لا توجد كاميرا متصلة');
          return;
        }
        setCameras(devices);
        setSelectedCameraId(devices[0].deviceId);
      } catch (err) {
        setError('فشل في الوصول إلى الكاميرات: ' + (err as Error).message);
      }
    };
    getCameras();
  }, []);

  // دالة إيقاف المسح الحالي
  const stopScanning = () => {
    isActive.current = false;
    if (readerRef.current) {
      try {
        // بعض الإصدارات تدعم stop، لكننا نكتفي بتعيين القيمة null
        readerRef.current = null;
      } catch (e) { /* ignore */ }
    }
  };

  // بدء المسح عند اختيار كاميرا
  useEffect(() => {
    if (!selectedCameraId || !videoRef.current) return;

    let mounted = true;

    // إيقاف المسح السابق
    stopScanning();

    // إعادة تعيين الحالة
    isActive.current = true;
    setIsScanning(true);

    const startScanner = async () => {
      try {
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        await reader.decodeFromVideoDevice(selectedCameraId, videoRef.current!, (result: any, err: any) => {
          if (!isActive.current || !mounted) return;
          if (result) {
            onDetected(result.getText());
            isActive.current = false;
            onClose();
          }
          if (err && !(err as any).message?.includes('NotFoundException')) {
            console.warn('Scan error:', err);
          }
        });
      } catch (err) {
        if (mounted) setError('فشل في بدء المسح: ' + (err as Error).message);
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      isActive.current = false;
      if (readerRef.current) {
        readerRef.current = null;
      }
      setIsScanning(false);
    };
  }, [selectedCameraId, onDetected, onClose]);

  // تبديل الكاميرا
  const switchCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].deviceId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-lg">مسح الباركود</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm text-center">
            {error}
          </div>
        ) : (
          <>
            <video ref={videoRef} className="w-full rounded-xl bg-black aspect-square" />

            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-slate-500">
                {isScanning ? '📷 جاري المسح...' : '⏳ جاري تحميل الكاميرا...'}
              </p>
              {cameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  تبديل الكاميرا
                </button>
              )}
            </div>

            {cameras.length > 0 && selectedCameraId && (
              <p className="text-xs text-slate-400 text-center mt-1">
                {cameras.find(c => c.deviceId === selectedCameraId)?.label || 'كاميرا'}
              </p>
            )}

            <p className="text-xs text-slate-500 text-center mt-2">وجّه الكاميرا إلى الباركود</p>
          </>
        )}
      </div>
    </div>
  );
}