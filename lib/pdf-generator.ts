import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ==================== TYPES ==================== */

interface PaymentHistoryItem {
  amount: number;
  paymentMode: string;
  paymentDate: string;
  balanceBefore: number;
  balanceAfter: number;
}

interface InvoiceItem {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerPreviousBalance?: number;
  isWalkIn?: boolean;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  notes?: string;
  paymentHistory?: PaymentHistoryItem[];
}

/* ==================== CONSTANTS ==================== */

const PAGE = {
  top: 20,
  bottom: 20,
  left: 14,
  right: 14,
};

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],     // SAP Blue
  secondary: [71, 85, 105] as [number, number, number],   // Slate
  success: [22, 163, 74] as [number, number, number],     // Green
  danger: [220, 38, 38] as [number, number, number],      // Red
  muted: [100, 116, 139] as [number, number, number],     // Gray text
  tableHeader: [30, 64, 175] as [number, number, number], // Same SAP blue
  warning: [234, 179, 8] as [number, number, number],     // Yellow for previous balance
};

/* ==================== HELPERS ==================== */

function drawHeader(doc: jsPDF, data: InvoiceData) {
  const width = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text("SALES INVOICE", PAGE.left, 15);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("Javaid Building Material Shop", PAGE.left, 21);
  doc.text("Phone: +92 XXXXXXXXXX", PAGE.left, 25);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice #: ${data.invoiceNumber}`, width - PAGE.right, 18, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${data.date}`, width - PAGE.right, 24, { align: "right" });

  doc.setDrawColor(220);
  doc.line(PAGE.left, 28, width - PAGE.right, 28);
}

function drawFooter(doc: jsPDF, pageNo: number, total: number) {
  const height = doc.internal.pageSize.getHeight();
  const width = doc.internal.pageSize.getWidth();

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Page ${pageNo} of ${total}`, width / 2, height - 10, {
    align: "center",
  });
}

/* ==================== MAIN ==================== */

export function generateSalesInvoice(data: InvoiceData) {
  const doc = new jsPDF();
  let cursorY = 34;

  /* ---------- HEADER ---------- */
  drawHeader(doc, data);

  /* ---------- CUSTOMER ---------- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(data.isWalkIn ? "Customer (Walk-in)" : "Bill To", PAGE.left, cursorY);
  cursorY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.customerName, PAGE.left, cursorY);
  cursorY += 5;

  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, PAGE.left, cursorY);
    cursorY += 5;
  }

  // Show previous balance if exists and not walk-in
  if (!data.isWalkIn && data.customerPreviousBalance !== undefined && data.customerPreviousBalance !== 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.warning);
    doc.text(
      `Previous Balance: Rs. ${data.customerPreviousBalance.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
      PAGE.left,
      cursorY
    );
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    cursorY += 5;
  }

  cursorY += 4;

  /* ---------- ITEMS TABLE ---------- */
  autoTable(doc, {
    startY: cursorY,
    margin: PAGE,
    head: [["Product", "Qty", "Rate", "Amount"]],
    body: data.items.map((i) => [
      i.productName,
      `${i.quantity} ${i.unit}`,
      `Rs. ${i.unitPrice.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
      `Rs. ${i.totalPrice.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
    ]),
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: COLORS.tableHeader,
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  /* ---------- TOTALS ---------- */
  const rightX = doc.internal.pageSize.getWidth() - PAGE.right;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text("Total:", rightX - 60, cursorY);
  doc.text(
    `Rs. ${data.totalAmount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
    rightX,
    cursorY,
    { align: "right" }
  );

  cursorY += 6;
  doc.text("Paid:", rightX - 60, cursorY);
  doc.setTextColor(...COLORS.success);
  doc.text(
    `Rs. ${data.paidAmount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
    rightX,
    cursorY,
    { align: "right" }
  );

  cursorY += 8;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.danger);
  doc.text("Balance Due:", rightX - 60, cursorY);
  doc.text(
    `Rs. ${data.dueAmount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
    rightX,
    cursorY,
    { align: "right" }
  );

  doc.setTextColor(0, 0, 0);
  cursorY += 12;

  /* ---------- PAYMENT HISTORY ---------- */
  if (data.paymentHistory && data.paymentHistory.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      margin: PAGE,
      head: [["Date", "Mode", "Amount", "Due Before", "Due After"]],
      body: data.paymentHistory.map((p) => [
        new Date(p.paymentDate).toLocaleDateString("en-PK"),
        p.paymentMode,
        `Rs. ${p.amount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
        `Rs. ${p.balanceBefore.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
        `Rs. ${p.balanceAfter.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
      ]),
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: COLORS.tableHeader,
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ---------- NOTES ---------- */
  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Notes:", PAGE.left, cursorY);
    cursorY += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const splitNotes = doc.splitTextToSize(data.notes, doc.internal.pageSize.getWidth() - PAGE.left - PAGE.right);
    doc.text(splitNotes, PAGE.left, cursorY);
  }

  /* ---------- FOOTERS ---------- */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, pages);
  }

  return doc;
}

/* ==================== PURCHASE INVOICE ==================== */

interface PurchaseInvoiceData {
  poNumber: string;
  date: string;
  vendorName: string;
  vendorPhone?: string;
  vendorPreviousBalance?: number;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount?: number;
  dueAmount: number;
  notes?: string;
  paymentHistory?: PaymentHistoryItem[];
}

export function generatePurchaseOrder(data: PurchaseInvoiceData) {
  const doc = new jsPDF();
  let cursorY = 34;

  /* ---------- HEADER ---------- */
  const width = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text("PURCHASE INVOICE", PAGE.left, 15);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("Javaid Building Material Shop", PAGE.left, 21);
  doc.text("Phone: +92 XXXXXXXXXX", PAGE.left, 25);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`PO #: ${data.poNumber}`, width - PAGE.right, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${data.date}`, width - PAGE.right, 24, { align: "right" });

  doc.setDrawColor(220);
  doc.line(PAGE.left, 28, width - PAGE.right, 28);

  /* ---------- VENDOR ---------- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Vendor", PAGE.left, cursorY);
  cursorY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.vendorName, PAGE.left, cursorY);
  cursorY += 5;

  if (data.vendorPhone) {
    doc.text(`Phone: ${data.vendorPhone}`, PAGE.left, cursorY);
    cursorY += 5;
  }

  // Show previous balance if exists
  if (data.vendorPreviousBalance !== undefined && data.vendorPreviousBalance !== 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.warning);
    doc.text(
      `Previous Balance: Rs. ${data.vendorPreviousBalance.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
      PAGE.left,
      cursorY
    );
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    cursorY += 5;
  }

  cursorY += 4;

  /* ---------- ITEMS TABLE ---------- */
  autoTable(doc, {
    startY: cursorY,
    margin: PAGE,
    head: [["Product", "Qty", "Rate", "Amount"]],
    body: data.items.map((i) => [
      i.productName,
      `${i.quantity} ${i.unit}`,
      `Rs. ${i.unitPrice.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
      `Rs. ${i.totalPrice.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
    ]),
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: COLORS.tableHeader,
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  /* ---------- TOTALS ---------- */
  const rightX = width - PAGE.right;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text("Total:", rightX - 60, cursorY);
  doc.text(
    `Rs. ${data.totalAmount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
    rightX,
    cursorY,
    { align: "right" }
  );

  if (data.paidAmount && data.paidAmount > 0) {
    cursorY += 6;
    doc.text("Paid:", rightX - 60, cursorY);
    doc.setTextColor(...COLORS.success);
    doc.text(
      `Rs. ${data.paidAmount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
      rightX,
      cursorY,
      { align: "right" }
    );
  }

  cursorY += 8;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.danger);
  doc.text("Balance Payable:", rightX - 60, cursorY);
  doc.text(
    `Rs. ${data.dueAmount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
    rightX,
    cursorY,
    { align: "right" }
  );

  doc.setTextColor(0, 0, 0);
  cursorY += 12;

  /* ---------- PAYMENT HISTORY ---------- */
  if (data.paymentHistory && data.paymentHistory.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      margin: PAGE,
      head: [["Date", "Mode", "Amount", "Due Before", "Due After"]],
      body: data.paymentHistory.map((p) => [
        new Date(p.paymentDate).toLocaleDateString("en-PK"),
        p.paymentMode,
        `Rs. ${p.amount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
        `Rs. ${p.balanceBefore.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
        `Rs. ${p.balanceAfter.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`,
      ]),
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: COLORS.tableHeader,
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ---------- NOTES ---------- */
  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Notes:", PAGE.left, cursorY);
    cursorY += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const splitNotes = doc.splitTextToSize(data.notes, doc.internal.pageSize.getWidth() - PAGE.left - PAGE.right);
    doc.text(splitNotes, PAGE.left, cursorY);
  }

  /* ---------- FOOTER ---------- */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, pages);
  }

  return doc;
}


/* ==================== PRINT & DOWNLOAD ==================== */

export function printInvoice(doc: jsPDF, filename: string) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);

  const win = window.open(url);
  if (win) {
    win.onload = () => {
      win.print();
    };
  }
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}