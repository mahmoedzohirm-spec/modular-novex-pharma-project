  // utils/exportReports.ts — Export reports to Excel and PDF
  // ============================================================
  import jsPDF from 'jspdf';
  import html2canvas from 'html2canvas';
  import { formatCurrency, formatDate, Order, Receipt, Pharmacy } from '../config/data';

  // ─── دالة مساعدة لإنشاء عنصر HTML للتقرير ───
  function buildReportHTML(
    title: string,
    subtitle: string,
    headers: string[],
    rows: string[][],
    footer: string,
    totalLabel: string,
    totalValue: string
  ): string {
    return `
      <div dir="rtl" style="font-family: 'Tajawal', sans-serif; padding: 20px; background: white; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #2563eb; font-size: 24px; text-align: center;">${title}</h1>
        <p style="text-align: center; color: #64748b; font-size: 14px;">${subtitle}</p>
        <p style="text-align: center; color: #64748b; font-size: 12px;">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
        <hr style="border: 1px solid #e2e8f0; margin: 16px 0;" />
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9;">
              ${headers.map(h => `<th style="padding: 8px; text-align: right; border-bottom: 1px solid #e2e8f0;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(cell => `<td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;">${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr style="border: 1px solid #e2e8f0; margin: 16px 0;" />
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8;">
          <span>${footer}</span>
          <span>${totalLabel}: ${totalValue}</span>
        </div>
      </div>
    `;
  }

  // ─── تصدير تقرير الطلبات إلى PDF (باستخدام html2canvas) ───
  export async function exportOrdersPDF(orders: Order[], pharmacyName?: string) {
    const headers = ['#', 'الصيدلية', 'الإجمالي', 'التاريخ', 'الحالة'];
    const rows = orders.map((order, index) => [
      String(index + 1),
      order.pharmacyName,
      formatCurrency(order.total),
      formatDate(order.timestamp),
      order.status === 'delivered' ? '✅ تم التسليم' : '⏳ قيد التنفيذ'
    ]);

    const totalAmount = orders.reduce((s, o) => s + o.total, 0);
    const html = buildReportHTML(
      'Novex Pharma - تقرير الطلبات',
      pharmacyName ? `الصيدلية: ${pharmacyName}` : 'جميع الصيدليات',
      headers,
      rows,
      `إجمالي الطلبات: ${orders.length}`,
      'الإجمالي الكلي',
      formatCurrency(totalAmount)
    );

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    doc.save(`orders-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ─── تصدير تقرير الإيصالات إلى PDF (باستخدام html2canvas) ───
  export async function exportReceiptsPDF(receipts: Receipt[], pharmacyName?: string) {
    const headers = ['#', 'الصيدلية', 'المبلغ', 'التاريخ', 'الحالة'];
    const rows = receipts.map((r, index) => {
      const statusMap = {
        approved: '✅ مقبول',
        pending: '⏳ معلق',
        rejected: '❌ مرفوض'
      };
      return [
        String(index + 1),
        r.pharmacyName,
        formatCurrency(r.amount),
        formatDate(r.timestamp),
        statusMap[r.status] || r.status
      ];
    });

    const totalAmount = receipts.reduce((s, r) => s + r.amount, 0);
    const html = buildReportHTML(
      'Novex Pharma - تقرير الإيصالات',
      pharmacyName ? `الصيدلية: ${pharmacyName}` : 'جميع الصيدليات',
      headers,
      rows,
      `إجمالي الإيصالات: ${receipts.length}`,
      'الإجمالي الكلي',
      formatCurrency(totalAmount)
    );

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    doc.save(`receipts-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ─── تصدير تقرير المبيعات إلى Excel (CSV) ───
  export function exportSalesCSV(orders: Order[], filename: string = 'sales-report') {
    const headers = ['رقم الطلب', 'الصيدلية', 'الإجمالي', 'التاريخ', 'الحالة'];
    const rows = orders.map(o => [
      o.id,
      o.pharmacyName,
      formatCurrency(o.total),
      formatDate(o.timestamp),
      o.status === 'delivered' ? 'تم التسليم' : 'قيد التنفيذ'
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ─── تصدير تقرير الإيصالات إلى Excel (CSV) ───
  export function exportReceiptsCSV(receipts: Receipt[], filename: string = 'receipts-report') {
    const headers = ['رقم الإيصال', 'الصيدلية', 'المبلغ', 'التاريخ', 'الحالة', 'الملاحظات'];
    const rows = receipts.map(r => [
      r.id,
      r.pharmacyName,
      formatCurrency(r.amount),
      formatDate(r.timestamp),
      r.status === 'approved' ? 'مقبول' : r.status === 'pending' ? 'معلق' : 'مرفوض',
      r.notes || ''
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ─── تصدير تقرير مالي شامل لصيدلية معينة إلى PDF ───
  export async function exportPharmacyFinancialReportPDF(
    pharmacy: Pharmacy,
    receipts: Receipt[],
    orders: Order[]
  ) {
    const approvedTotal = receipts
      .filter((r) => r.status === 'approved')
      .reduce((s, r) => s + r.amount, 0);

    const pendingTotal = receipts
      .filter((r) => r.status === 'pending')
      .reduce((s, r) => s + r.amount, 0);

    const rejectedTotal = receipts
      .filter((r) => r.status === 'rejected')
      .reduce((s, r) => s + r.amount, 0);

    const totalOrders = orders.length;
    const totalOrdersValue = orders.reduce((s, o) => s + o.total, 0);

    const html = `
      <div dir="rtl" style="font-family: 'Tajawal', sans-serif; padding: 30px; background: white; max-width: 900px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">Novex Pharma</h1>
          <p style="color: #64748b; font-size: 16px; margin: 4px 0;">تقرير مالي شامل للصيدلية</p>
          <h2 style="color: #0f172a; font-size: 22px; margin: 8px 0;">${pharmacy.pharmacyName}</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">@${pharmacy.username} | ${pharmacy.phone}</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        <hr style="border: 1px solid #e2e8f0; margin: 16px 0;" />
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="background: #dcfce7; padding: 12px; border-radius: 12px; text-align: center;">
            <div style="font-size: 12px; color: #15803d;">✅ المدفوع (مقبول)</div>
            <div style="font-size: 22px; font-weight: 900; color: #15803d;">${formatCurrency(approvedTotal)}</div>
          </div>
          <div style="background: #fef3c7; padding: 12px; border-radius: 12px; text-align: center;">
            <div style="font-size: 12px; color: #b45309;">⏳ تحت المراجعة</div>
            <div style="font-size: 22px; font-weight: 900; color: #b45309;">${formatCurrency(pendingTotal)}</div>
          </div>
          <div style="background: #fee2e2; padding: 12px; border-radius: 12px; text-align: center;">
            <div style="font-size: 12px; color: #b91c1c;">❌ المرفوض</div>
            <div style="font-size: 22px; font-weight: 900; color: #b91c1c;">${formatCurrency(rejectedTotal)}</div>
          </div>
          <div style="background: #dbeafe; padding: 12px; border-radius: 12px; text-align: center; grid-column: span 3;">
            <div style="font-size: 12px; color: #1d4ed8;">💳 إجمالي قيمة الطلبات</div>
            <div style="font-size: 22px; font-weight: 900; color: #1d4ed8;">${formatCurrency(totalOrdersValue)} (${totalOrders} طلب)</div>
          </div>
        </div>
        <h3 style="color: #0f172a; font-size: 18px; margin: 16px 0 8px;">📋 قائمة الإيصالات</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">#</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">المبلغ</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">التاريخ</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">الحالة</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${receipts.map((r, i) => {
              const statusMap = {
                approved: '✅ مقبول',
                pending: '⏳ معلق',
                rejected: '❌ مرفوض'
              };
              return `
                <tr>
                  <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;">${i + 1}</td>
                  <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;">${formatCurrency(r.amount)}</td>
                  <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;">${formatDate(r.timestamp)}</td>
                  <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;">${statusMap[r.status] || r.status}</td>
                  <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;">${r.notes || '—'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <h3 style="color: #0f172a; font-size: 18px; margin: 16px 0 8px;">📦 قائمة الطلبات</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">#</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">الإجمالي</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">التاريخ</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((o, i) => `
              <tr>
                <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;">${i + 1}</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;">${formatCurrency(o.total)}</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;">${formatDate(o.timestamp)}</td>
                <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;">${o.status === 'delivered' ? '✅ تم التسليم' : '⏳ قيد التنفيذ'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr style="border: 1px solid #e2e8f0; margin: 20px 0;" />
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8;">
          <span>تم إنشاء هذا التقرير بواسطة نظام Novex Pharma</span>
          <span>جميع الحقوق محفوظة © 2025</span>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    doc.save(`financial-report-${pharmacy.pharmacyName}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }