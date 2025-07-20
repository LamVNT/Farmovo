import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportImportTransactionPdf(transaction, details, supplierDetails, userDetails, storeDetails, zones = []) {
    const doc = new jsPDF();

    // ===== HEADER =====
    doc.setFontSize(18);
    doc.text(`IMPORT TRANSACTION DETAILS${transaction?.name ? ': ' + transaction.name : ''}`, 105, 16, { align: "center" });

    // Status
    const statusMap = {
        'DRAFT': { label: '📝 Draft', color: '#6b7280' },
        'WAITING_FOR_APPROVE': { label: '⏳ Waiting for Approval', color: '#f59e0b' },
        'COMPLETE': { label: '✅ Completed', color: '#10b981' },
        'CANCEL': { label: '❌ Cancelled', color: '#ef4444' },
    };
    const status = statusMap[transaction?.status] || { label: transaction?.status, color: '#6b7280' };
    doc.setFontSize(12);
    doc.setTextColor(60,60,60);
    doc.text(`${status.label || ''}`, 14, 26);
    doc.setTextColor(60,60,60);
    doc.text(`Date: ${transaction?.importDate ? new Date(transaction.importDate).toLocaleDateString("en-GB") : ""}`, 150, 26);
    doc.text(`Time: ${transaction?.importDate ? new Date(transaction.importDate).toLocaleTimeString("en-GB") : ""}`, 150, 32);

    // ===== INFO BLOCKS =====
    doc.setFontSize(13);
    doc.setTextColor(33, 111, 237); // blue
    doc.text("Store Information", 14, 42);
    doc.setTextColor(60,60,60);
    doc.setFontSize(11);
    doc.text(`Store Name: ${storeDetails?.name || transaction.storeName || storeDetails?.storeName || 'N/A'}`, 14, 48);
    doc.text(`Address: ${transaction.storeAddress || storeDetails?.storeAddress || storeDetails?.address || 'N/A'}`, 14, 54);
    doc.text(`Created by: ${userDetails?.fullName || userDetails?.name || userDetails?.username || transaction.createdBy || 'N/A'}`, 14, 60);

    doc.setFontSize(13);
    doc.setTextColor(34, 197, 94); // green
    doc.text("Supplier Information", 110, 42);
    doc.setTextColor(60,60,60);
    doc.setFontSize(11);
    doc.text(`Name: ${supplierDetails?.name || transaction.supplierName || 'N/A'}`, 110, 48);
    doc.text(`Phone: ${supplierDetails?.phone || 'N/A'}`, 110, 54);
    doc.text(`Address: ${supplierDetails?.address || 'N/A'}`, 110, 60);

    // ===== PRODUCT TABLE =====
    doc.setFontSize(13);
    doc.setTextColor(33, 37, 41);
    doc.text("Product List", 14, 72);
    doc.setFontSize(10);
    const tableData = details.map((d, idx) => [
        idx + 1,
        {
            content: `${d.productName || ''}\nCode: ${d.productCode || 'N/A'}`,
            styles: { fontStyle: 'bold' }
        },
        'pcs',
        d.importQuantity,
        (d.unitImportPrice || 0).toLocaleString('en-US'),
        (d.unitSalePrice || 0).toLocaleString('en-US'),
        ((d.unitImportPrice || 0) * (d.importQuantity || 0)).toLocaleString('en-US'),
        d.expireDate ? new Date(d.expireDate).toLocaleDateString('en-GB') : '',
        (Array.isArray(d.zones_id) && d.zones_id.length > 0)
            ? d.zones_id.map(zoneId => {
                const zone = zones.find(z => z.id === Number(zoneId) || z.id === zoneId);
                return zone ? (zone.name || zone.zoneName) : zoneId;
            }).join(', ')
            : ''
    ]);
    autoTable(doc, {
        head: [[
            "No.",
            "Product Name",
            "Unit",
            "Quantity",
            "Import Price",
            "Sale Price",
            "Total",
            "Expiry Date",
            "Zone"
        ]],
        body: tableData,
        startY: 76,
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [220, 230, 241], textColor: 33, fontStyle: 'bold' },
        bodyStyles: { valign: 'middle' },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 38 },
            2: { halign: 'center', cellWidth: 14 },
            3: { halign: 'center', cellWidth: 18 },
            4: { halign: 'right', cellWidth: 22 },
            5: { halign: 'right', cellWidth: 22 },
            6: { halign: 'right', cellWidth: 24 },
            7: { halign: 'center', cellWidth: 22 },
            8: { cellWidth: 28 },
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    // ===== SUMMARY BLOCK =====
    let y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : 90;
    doc.setFontSize(12);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(12, y - 4, 186, 28, 3, 3, 'F');
    doc.setTextColor(33, 37, 41);
    doc.text(`Total Amount:`, 18, y + 4);
    doc.setFont(undefined, 'bold');
    doc.text(`${(transaction?.totalAmount || 0).toLocaleString('en-US')} VND`, 70, y + 4);
    doc.setFont(undefined, 'normal');
    doc.text(`Paid Amount:`, 18, y + 12);
    doc.setTextColor(34, 111, 237);
    doc.text(`${(transaction?.paidAmount || 0).toLocaleString('en-US')} VND`, 70, y + 12);
    doc.setTextColor(33, 37, 41);
    doc.text(`Remaining:`, 18, y + 20);
    const remain = (transaction?.totalAmount || 0) - (transaction?.paidAmount || 0);
    doc.setTextColor(remain > 0 ? 239 : 16, remain > 0 ? 68 : 185, remain > 0 ? 68 : 129); // red or green
    doc.setFont(undefined, 'bold');
    doc.text(`${remain.toLocaleString('en-US')} VND`, 70, y + 20);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(33, 37, 41);

    // ===== NOTE BLOCK =====
    if (transaction.importTransactionNote) {
        let noteY = y + 32;
        doc.setFillColor(255, 249, 196);
        doc.roundedRect(12, noteY - 2, 186, 16, 2, 2, 'F');
        doc.setDrawColor(255, 193, 7);
        doc.setLineWidth(1);
        doc.line(14, noteY - 2, 14, noteY + 14);
        doc.setFontSize(11);
        doc.setTextColor(120, 90, 0);
        doc.text('Note:', 18, noteY + 2);
        doc.setFontSize(10);
        doc.text(transaction.importTransactionNote, 18, noteY + 8, { maxWidth: 176 });
        doc.setTextColor(33, 37, 41);
    }

    doc.save(`import_transaction_${transaction?.name || "transaction"}.pdf`);
} 