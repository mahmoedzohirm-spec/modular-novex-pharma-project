// ============================================================
// components/InvoicePDF.tsx — Generate and download PDF invoice
// ============================================================
import { Order, formatCurrency, formatDate } from '../config/data';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── دالة مساعدة لحساب السعر المخفض (معدلة لتأخذ الكمية) ───
function getDiscountedPrice(price: number, bonus: string, quantity: number): number {
  if (!bonus) return price;
  const parts = bonus.split('+');
  if (parts.length !== 2) return price;
  const paid = parseInt(parts[0]);
  const free = parseInt(parts[1]);
  if (isNaN(paid) || isNaN(free) || paid + free === 0) return price;
  
  // عدد الحبات المجانية المستحقة
  const freeUnits = Math.floor(quantity / paid) * free;
  // عدد الحبات المدفوعة
  const paidUnits = quantity - freeUnits;
  // السعر الإجمالي المخفض
  const totalDiscounted = paidUnits * price;
  // السعر المخفض للوحدة
  return totalDiscounted / quantity;
}

export function generateInvoicePDF(order: Order, pharmacyName: string) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;
  let y = margin;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235);
  doc.text('Novex Pharma', pageWidth / 2, y, { align: 'center' });
  y += 10;
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text('مستودع الأدوية والتوزيع', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Invoice title
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('فاتورة طلب', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Order details
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(`رقم الطلب: ${order.id}`, margin, y);
  doc.text(`التاريخ: ${formatDate(order.timestamp)}`, pageWidth - margin, y, { align: 'right' });
  y += 8;
  doc.text(`الصيدلية: ${pharmacyName}`, margin, y);
  y += 12;

  // Line
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Table header
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('المنتج', margin + 10, y);
  doc.text('الكمية', pageWidth / 2 + 20, y);
  doc.text('السعر', pageWidth - margin - 10, y, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Items with bonus display (حساب السعر المخفض لكل صنف بناءً على الكمية)
  order.items.forEach((item) => {
    const originalPrice = item.price; // السعر الأصلي
    const discountedPrice = getDiscountedPrice(originalPrice, item.bonus || '', item.quantity);
    const totalPrice = discountedPrice * item.quantity;
    const discountInfo = item.bonus ? ` (بونص: ${item.bonus})` : '';

    doc.text(item.medicineName, margin + 10, y);
    doc.text(String(item.quantity), pageWidth / 2 + 20, y);
    doc.text(
      `${formatCurrency(totalPrice)}${discountInfo}`,
      pageWidth - margin - 10,
      y,
      { align: 'right' }
    );
    y += 7;
    if (y > 260) {
      doc.addPage();
      y = margin;
    }
  });

  y += 6;
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Total (إعادة حساب الإجمالي بناءً على الأسعار المخفضة)
  const total = order.items.reduce((sum, item) => {
    const discounted = getDiscountedPrice(item.price, item.bonus || '', item.quantity);
    return sum + discounted * item.quantity;
  }, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text('الإجمالي:', pageWidth - margin - 10, y, { align: 'right' });
  doc.text(formatCurrency(total), pageWidth - margin - 10, y + 8, { align: 'right' });

  // Footer
  const footerY = 280;
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('شكراً لثقتكم بنا', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Novex Pharma - جميع الحقوق محفوظة', pageWidth / 2, footerY + 6, { align: 'center' });

  // Save PDF
  doc.save(`invoice-${order.id}.pdf`);
}

// Alternative: generate from HTML element
export async function generateInvoiceFromElement(elementId: string, filename: string = 'invoice.pdf') {
  const element = document.getElementById(elementId);
  if (!element) return;
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');
  const doc = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 190;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  doc.save(filename);
}