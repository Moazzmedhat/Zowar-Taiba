// Helper to convert array buffer to base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper to convert Image to Base64 (using canvas)
function imageToBase64(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch (err) {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.crossOrigin = 'anonymous';
        img.src = url;
    });
}

// Cache for loaded base64 assets
let fontRegularBase64 = null;
let fontBoldBase64 = null;
let logoBase64 = null;
let stampBase64 = null;

// Preload fonts and images on startup
async function preloadPdfAssets() {
    try {
        const [regularBuf, boldBuf] = await Promise.all([
            fetch('fonts/Cairo/Cairo-Regular.ttf').then(res => res.arrayBuffer()),
            fetch('fonts/Cairo/Cairo-Bold.ttf').then(res => res.arrayBuffer())
        ]);
        fontRegularBase64 = arrayBufferToBase64(regularBuf);
        fontBoldBase64 = arrayBufferToBase64(boldBuf);
        
        logoBase64 = await imageToBase64('logo.png');
        stampBase64 = await imageToBase64('stamp.png');
        console.log('PDF assets preloaded successfully.');
    } catch (err) {
        console.error('Failed to preload PDF assets:', err);
    }
}

// Generate PDF using jsPDF + AutoTable
async function generateTripPdf(data) {
    const { jsPDF } = window.jspdf;
    
    // Create portrait A4 PDF document
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Register local Cairo fonts
    if (fontRegularBase64) {
        doc.addFileToVFS('Cairo-Regular.ttf', fontRegularBase64);
        doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
    }
    if (fontBoldBase64) {
        doc.addFileToVFS('Cairo-Bold.ttf', fontBoldBase64);
        doc.addFont('Cairo-Bold.ttf', 'Cairo', 'bold');
    }

    doc.setFont('Cairo', 'normal');

    // Helper: Draw common header on a page
    function drawHeader(pageIndex, qrCodeUrl) {
        doc.setFont('Cairo', 'bold');
        
        // Right header (Arabic title & license info)
        doc.setTextColor(0, 150, 136); // Teal
        doc.setFontSize(15);
        doc.text('مؤسسة زوار طيبة', 200, 18, { align: 'right' });
        doc.setTextColor(0, 0, 0); // Black
        doc.setFontSize(10);
        doc.setFont('Cairo', 'normal');
        doc.text('للنقل البري', 200, 23, { align: 'right' });
        doc.text('ترخيص رقم - 3500005546', 200, 28, { align: 'right' });

        // Center Logo
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 92, 10, 24, 24);
        }
        doc.setFontSize(7);
        doc.setTextColor(0, 150, 136); // Teal
        doc.setFont('Cairo', 'bold');
        doc.text('Zowar Taiba Land Transport', 104, 37, { align: 'center' });

        // Left QR Code
        if (qrCodeUrl) {
            doc.addImage(qrCodeUrl, 'PNG', 10, 10, 22, 22);
        }
    }

    // Helper: Draw common footer on a page
    function drawFooter(footerBarText) {
        doc.setFont('Cairo', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(0, 0, 0);
        
        // Line break dashed
        doc.setLineDashPattern([1, 1], 0);
        doc.line(10, 275, 200, 275);
        
        // Address & Contacts
        doc.text('📍 المدينة المنورة - الدائري الثاني طريق الملك عبدالله - خلف محطة بيحان', 200, 279, { align: 'right' });
        doc.text('✉️ zawartaiba@gmail.com | 📞 00966 50 484 5815', 10, 279, { align: 'left' });

        // Footer Bar
        doc.setFillColor(15, 76, 129); // Blue bar
        doc.rect(10, 282, 190, 8, 'F');
        doc.setTextColor(255, 255, 255); // White text
        doc.text(footerBarText, 200, 287, { align: 'right' });
        doc.text('Zowar Taiba Land Transport | C.R : 3500005546', 12, 287, { align: 'left' });
    }

    // Helper: Draw Section Title
    function drawSectionTitle(y, title) {
        doc.setFillColor(0, 150, 136); // Teal
        doc.rect(10, y, 190, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Cairo', 'bold');
        doc.setFontSize(10);
        doc.text(title, 105, y + 5, { align: 'center' });
    }

    // ==========================================
    // PAGE 1: كشف الركاب
    // ==========================================
    let yPos = 43;
    drawHeader(1, data.qrUrl);
    
    // Doc Title
    doc.setFont('Cairo', 'bold');
    doc.setFontSize(13);
    doc.text('كشف الركاب', 105, yPos, { align: 'center' });
    yPos += 5;

    // General info (Day, Date, Booking ID)
    doc.autoTable({
        startY: yPos,
        theme: 'plain',
        styles: { font: 'Cairo', fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
            0: { align: 'right', fillColor: [245, 245, 245], minCellHeight: 10 },
            1: { align: 'right', fillColor: [245, 245, 245] },
            2: { align: 'right', fillColor: [245, 245, 245] }
        },
        body: [[
            `اليوم: ${data.dayString}`,
            `التاريخ: ${data.dateString}`,
            `رقم الحجز: ${data.bookingId}`
        ]],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 4;

    // Driver Section Title
    drawSectionTitle(yPos, 'بيانات السائق');
    yPos += 9;

    // Driver Details Table
    doc.autoTable({
        startY: yPos,
        theme: 'grid',
        styles: { font: 'Cairo', fontSize: 8.5, cellPadding: 2, lineColor: [220, 220, 220] },
        headStyles: { fillColor: [0, 150, 136], textColor: [255, 255, 255], fontStyle: 'bold', align: 'center' },
        columnStyles: {
            0: { align: 'right', width: 63 },
            1: { align: 'right', width: 63 },
            2: { align: 'right', width: 64 }
        },
        body: [
            [`السائق: ${data.driverName}`, `الهويه: ${data.nationalId}`, `الجوال: ${data.mobile}`],
            [`السيارة: ${data.carModel}`, `اللون: ${data.carColor}`, `رقم اللوحه: ${data.plateNumber}`]
        ],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 4;

    // Route Table
    doc.autoTable({
        startY: yPos,
        theme: 'grid',
        styles: { font: 'Cairo', fontSize: 8.5, cellPadding: 2, lineColor: [220, 220, 220] },
        columnStyles: {
            0: { align: 'right', width: 95 },
            1: { align: 'right', width: 95 }
        },
        body: [
            [`جهة القدوم: ${data.source}`, `جهة الوصول: ${data.destination}`]
        ],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 4;

    // Guest Table
    doc.autoTable({
        startY: yPos,
        theme: 'grid',
        styles: { font: 'Cairo', fontSize: 8.5, cellPadding: 2, lineColor: [220, 220, 220] },
        columnStyles: {
            0: { align: 'right', width: 63 },
            1: { align: 'right', width: 63 },
            2: { align: 'right', width: 64 }
        },
        body: [
            [`الضيف: ${data.guestName}`, `الجوال: ${data.guestPhone}`, `رقم الرحله: ${data.flightNo}`]
        ],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 4;

    // Companions Title
    drawSectionTitle(yPos, 'بيانات المرافقين');
    yPos += 9;

    // Build companion side-by-side table rows
    const compRows = [];
    for (let i = 0; i < 6; i++) {
        const left = data.companions[i] || { name: '', id: '', nationality: '' };
        const right = data.companions[i + 6] || { name: '', id: '', nationality: '' };
        compRows.push([
            String(i + 1), left.name, left.id, left.nationality,
            String(i + 7), right.name, right.id, right.nationality
        ]);
    }

    doc.autoTable({
        startY: yPos,
        theme: 'grid',
        styles: { font: 'Cairo', fontSize: 7.5, cellPadding: 1.5, lineColor: [200, 200, 200] },
        headStyles: { fillColor: [0, 150, 136], textColor: [255, 255, 255], fontStyle: 'bold', align: 'center' },
        head: [['#', 'الاسم', 'رقم الهوية', 'الجنسية', '#', 'الاسم', 'رقم الهوية', 'الجنسية']],
        body: compRows,
        columnStyles: {
            0: { align: 'center', width: 8 },
            1: { align: 'right', width: 44 },
            2: { align: 'center', width: 28 },
            3: { align: 'center', width: 15 },
            4: { align: 'center', width: 8 },
            5: { align: 'right', width: 44 },
            6: { align: 'center', width: 28 },
            7: { align: 'center', width: 15 }
        },
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 4;

    // Important Notice block + Stamp
    doc.setTextColor(0, 0, 0);
    doc.setFont('Cairo', 'bold');
    doc.setFontSize(8.5);
    doc.text('ملاحظة هامة', 105, yPos, { align: 'center' });
    yPos += 4;
    doc.setFont('Cairo', 'normal');
    doc.setFontSize(8);
    doc.text('في حالة عدم تطابق بيانات الضيف مع الاثبات تكن عرضه للجزاء وهذا تعهد منا بذلك', 105, yPos, { align: 'center' });
    doc.text('شاكرين لكم حسن تعاونكم معنا', 105, yPos + 4, { align: 'center' });

    // Official Stamp
    if (stampBase64) {
        doc.addImage(stampBase64, 'PNG', 10, yPos - 6, 26, 26);
    }

    drawFooter('امر تشغيل شامل كشف الركاب تم إصداره إلكترونيا من السيستم');

    // ==========================================
    // PAGE 2: عقد نقل على الطرق البرية
    // ==========================================
    doc.addPage();
    drawHeader(2, data.qrUrl);
    yPos = 43;

    // Doc Title
    doc.setFont('Cairo', 'bold');
    doc.setFontSize(13);
    doc.text('عقد نقل على الطرق البرية', 105, yPos, { align: 'center' });
    yPos += 5;

    // Date Table
    doc.autoTable({
        startY: yPos,
        theme: 'plain',
        styles: { font: 'Cairo', fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
            0: { align: 'right', fillColor: [245, 245, 245] }
        },
        body: [[`التاريخ: ${data.dateString}`]],
        margin: { left: 130, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 8;

    // Legal Text
    doc.setFont('Cairo', 'normal');
    doc.setFontSize(9.5);
    const splitText1 = doc.splitTextToSize('تم ابرام هذا العقد بين المتعاقدين بناء على المادة (39) التاسعة والثلاثون من اللائحة المنظمة لنشاط النقل المتخصص وتأجير وتوجيه الحافلات وبناء على الفقرة (1) من المادة (39) والتي تنص على أن يجب على الناقل ابرام عقد نقل مع الأطراف المحددين في المادة (40) قبل تنفيذ عمليات النقل على الطرق البرية وبما لا يخالف أحكام هذه اللائحة ووفقاً للآلية التي تحددها هيئة النقل وبناء على ما سبق تم ابرام عقد النقل بين الأطراف الآتية:', 180);
    doc.text(splitText1, 200, yPos, { align: 'right', lineHeightFactor: 1.6 });
    yPos += 34;

    // Parties
    doc.setFont('Cairo', 'bold');
    doc.text(`الطرف الأول / مؤسسة زوار طيبة للنقل البري ترخيص رقم - 3500005546`, 200, yPos, { align: 'right' });
    doc.text(`الطرف الثاني / ${data.guestName}`, 200, yPos + 6, { align: 'right' });
    yPos += 16;

    // Description text
    doc.setFont('Cairo', 'normal');
    doc.text('اتفق الطرفان على ان ينفذ الطرف الأول عملية النقل للطرف الثاني مع مرافقيه وذويهم من الموقع المحدد مسبقاً مع الطرف الثاني وتوصيلهم الى الجهه المحدده بالعقد.', 200, yPos, { align: 'right', maxWidth: 180 });
    yPos += 14;

    // Route Details
    doc.autoTable({
        startY: yPos,
        theme: 'grid',
        styles: { font: 'Cairo', fontSize: 9, cellPadding: 3, lineColor: [220, 220, 220] },
        columnStyles: {
            0: { align: 'right', width: 90 },
            1: { align: 'right', width: 90 }
        },
        body: [
            [`النقل من: ${data.source}`, `وصولاً الى: ${data.destination}`]
        ],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Terms
    const splitText2 = doc.splitTextToSize('في حال الغاء التعاقد لاي سبب شخصي او اسباب اخرى تتعلق في الحجوزات او الانظمة تكون سياسة الالغاء والاستبدال حسب نظام وزارة التجارة السعودي.', 180);
    const splitText3 = doc.splitTextToSize('في حال الحجز وتم الالغاء قبل موعد الرحلة باكثر من 24 ساعة يتم استرداد المبلغ كامل.', 180);
    const splitText4 = doc.splitTextToSize('في حالة طلب الطرف الثاني الحجز من خلال الموقع الالكتروني للموقع يعتبر الحجز وموافقته على الشروط الاحكام بالموقع الالكتروني هو موافقة على هذا العقد لتنفيذ عملية النقل المتفق عليها مع الطرف الأول بواسطة حافلات المؤسسة المرخصة والمتوافقة مع الاشتراطات المقررة من هيئة النقل.', 180);

    doc.text(splitText2, 200, yPos, { align: 'right', lineHeightFactor: 1.5 });
    yPos += 14;
    doc.text(splitText3, 200, yPos, { align: 'right', lineHeightFactor: 1.5 });
    yPos += 10;
    doc.text(splitText4, 200, yPos, { align: 'right', lineHeightFactor: 1.5 });

    drawFooter('امر تشغيل شامل كشف الركاب تم إصداره إلكترونيا من السيستم');

    // ==========================================
    // PAGE 3: سجل الفحص اليومي للسيارة
    // ==========================================
    doc.addPage();
    drawHeader(3, data.qrUrl);
    yPos = 43;

    // Doc Title
    doc.setFont('Cairo', 'bold');
    doc.setFontSize(13);
    doc.text('سجل الفحص اليومي للسيارة', 105, yPos, { align: 'center' });
    yPos += 5;

    // Metadata
    doc.autoTable({
        startY: yPos,
        theme: 'plain',
        styles: { font: 'Cairo', fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
            0: { align: 'right', fillColor: [245, 245, 245] },
            1: { align: 'right', fillColor: [245, 245, 245] }
        },
        body: [[`التاريخ: ${data.dateString}`, `رقم الحجز: ${data.bookingId}`]],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 3;

    doc.autoTable({
        startY: yPos,
        theme: 'plain',
        styles: { font: 'Cairo', fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
            0: { align: 'right', fillColor: [245, 245, 245] },
            1: { align: 'right', fillColor: [245, 245, 245] }
        },
        body: [[`السائق: ${data.driverName}`, `رقم اللوحه: ${data.plateNumber}`]],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 4;

    // Helper to generate inspection table
    function makeInspectionAutoTable(title, items, y) {
        doc.setFont('Cairo', 'bold');
        doc.setFontSize(9);
        doc.text(title, 200, y, { align: 'right' });
        
        const rows = items.map(item => [item, '✓', '', '']);
        doc.autoTable({
            startY: y + 2,
            theme: 'grid',
            styles: { font: 'Cairo', fontSize: 7.5, cellPadding: 1.2, lineColor: [210, 210, 210] },
            headStyles: { fillColor: [235, 235, 235], textColor: [0, 0, 0], fontStyle: 'bold', align: 'center' },
            head: [['البند', 'سليم', 'غير سليم', 'ملاحظات']],
            body: rows,
            columnStyles: {
                0: { align: 'right', width: 90 },
                1: { align: 'center', width: 25, textColor: [0, 150, 136], fontStyle: 'bold' },
                2: { align: 'center', width: 25 },
                3: { align: 'center', width: 40 }
            },
            margin: { left: 10, right: 10 }
        });
        return doc.lastAutoTable.finalY;
    }

    yPos = makeInspectionAutoTable('أولاً - فحص مؤشرات لوحة القيادة', [
        'مؤشر الوقود', 'مؤشر الحرارة', 'مؤشر ضغط الزيت', 'لمبة فحص المحرك', 'ABS', 'لمبات التحذير'
    ], yPos);

    yPos = makeInspectionAutoTable('ثانياً - الفحص الخارجي', [
        'الإطارات وضغط الهواء', 'الأنوار الأمامية والخلفية', 'الإشارات التحذيرية', 'الزجاج والمرايا', 'عدم وجود تسريبات'
    ], yPos + 4);

    yPos = makeInspectionAutoTable('ثالثاً - أدوات ومتمتلكات الأمن والسلامة', [
        'طفاية حريق', 'مثلث تحذير', 'حقيبة إسعافات أولية', 'مطرقة كسر الزجاج', 'أحزمة الأمان'
    ], yPos + 4);

    yPos += 5;

    // Declaration Box
    doc.autoTable({
        startY: yPos,
        theme: 'grid',
        styles: { font: 'Cairo', fontSize: 8, cellPadding: 2.5, lineColor: [0, 0, 0] },
        body: [[
            `إقرار\nأقر أنا السائق أعلاه بأنني قمت بفحص الحافلة والتأكد من سلامتها وجاهزيتها قبل التشغيل.`
        ]],
        columnStyles: {
            0: { align: 'right', fillColor: [255, 255, 255] }
        },
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 6;

    // Signature
    doc.setFont('Cairo', 'normal');
    doc.text(`اسم السائق - ${data.driverName}`, 15, yPos, { align: 'left' });

    drawFooter('سجل فحص يومي للسيارة تم إصداره إلكترونيا من السيستم');

    return doc;
}
