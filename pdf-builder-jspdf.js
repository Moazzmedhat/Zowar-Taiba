/**
 * Arabic Text Renderer using Browser Canvas API
 * 
 * Instead of manually reshaping Arabic glyphs (which fails because jsPDF's embedded
 * font doesn't have Arabic Presentation Forms in its cmap), we use the browser's
 * native text rendering engine which handles Arabic shaping and RTL perfectly.
 * 
 * Each Arabic text string is rendered to a Canvas, then embedded as an image in the PDF.
 */

// Cache for the Arabic canvas font (set after Cairo font loads via @font-face)
let arabicCanvasFont = 'Cairo, Arial, sans-serif';

/**
 * Render Arabic text to a canvas and return as base64 PNG data URL.
 * The browser handles all Arabic shaping (connecting letters) and RTL direction natively.
 * 
 * @param {string} text - The Arabic text to render
 * @param {number} fontSize - Font size in pixels
 * @param {string} color - CSS color string (e.g. '#000000')
 * @param {string} fontWeight - 'normal' or 'bold'
 * @returns {{ dataUrl: string, widthPx: number, heightPx: number }}
 */
function renderArabicToCanvas(text, fontSize, color, fontWeight) {
    if (!text) return null;
    
    const scale = 3; // Retina scale for crisp text
    const fontStr = `${fontWeight || 'normal'} ${fontSize * scale}px ${arabicCanvasFont}`;
    
    // Measure text width
    const measurer = document.createElement('canvas');
    const mctx = measurer.getContext('2d');
    mctx.font = fontStr;
    const metrics = mctx.measureText(text);
    const textWidthPx = Math.ceil(metrics.width) + 20; // slight padding
    const textHeightPx = Math.ceil(fontSize * scale * 1.5);
    
    // Render text
    const canvas = document.createElement('canvas');
    canvas.width = textWidthPx;
    canvas.height = textHeightPx;
    const ctx = canvas.getContext('2d');
    
    ctx.font = fontStr;
    ctx.fillStyle = color || '#000000';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    // Draw text from the right edge
    ctx.fillText(text, textWidthPx - 5, textHeightPx / 2);
    
    return {
        dataUrl: canvas.toDataURL('image/png'),
        widthPx: textWidthPx,
        heightPx: textHeightPx
    };
}

/**
 * Add Arabic text to a jsPDF document as a canvas-rendered image.
 * This completely bypasses jsPDF's font system for Arabic text.
 * 
 * @param {object} doc - jsPDF document instance
 * @param {string} text - Arabic text string
 * @param {number} xMm - X position in mm (right edge for RTL, or use align)
 * @param {number} yMm - Y position in mm (baseline)
 * @param {object} options - { fontSize, color, fontStyle, align, maxWidthMm }
 * @returns {number} - width of rendered image in mm
 */
function addArabicText(doc, text, xMm, yMm, options = {}) {
    if (!text || !text.toString().trim()) return 0;
    
    const str = text.toString();
    const fontSize = options.fontSize || doc.getFontSize();
    const color = options.color || '#000000';
    const fontWeight = (options.fontStyle === 'bold') ? 'bold' : 'normal';
    const align = options.align || 'right';
    
    const rendered = renderArabicToCanvas(str, fontSize * 1.5, color, fontWeight);
    if (!rendered) return 0;
    
    // Convert pixels to mm (at 96 DPI: 1mm = 3.7795px; we used scale=3 so actual px / 3 / 3.7795)
    const scale = 3;
    const pxToMm = 1 / (3.7795 * scale);
    const widthMm = rendered.widthPx * pxToMm;
    const heightMm = rendered.heightPx * pxToMm;
    
    // Adjust x position based on alignment
    let drawX = xMm;
    if (align === 'right') {
        drawX = xMm - widthMm;
    } else if (align === 'center') {
        drawX = xMm - widthMm / 2;
    } else {
        drawX = xMm; // left
    }
    
    // Y is baseline in jsPDF; center the image vertically around it
    const drawY = yMm - heightMm * 0.7;
    
    doc.addImage(rendered.dataUrl, 'PNG', drawX, drawY, widthMm, heightMm);
    return widthMm;
}



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

    // We use addArabicText() for all Arabic strings — it renders via Canvas so the
    // browser handles shaping and RTL natively. jsPDF's text() is only used for
    // English/numbers where no shaping is needed.

    // Set a default (Helvetica) font for non-Arabic text like numbers
    doc.setFont('Helvetica', 'normal');

    // Helper: Draw common header on a page
    function drawHeader(pageIndex, qrCodeUrl) {
        // Right header (Arabic title & license info)
        addArabicText(doc, 'مؤسسة زوار طيبة', 200, 18, { fontSize: 15, color: '#009688', fontStyle: 'bold', align: 'right' });
        addArabicText(doc, 'للنقل البري', 200, 23, { fontSize: 10, color: '#000000', fontStyle: 'normal', align: 'right' });
        addArabicText(doc, 'ترخيص رقم - 3500005546', 200, 28, { fontSize: 9, color: '#000000', fontStyle: 'normal', align: 'right' });

        // Center Logo
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 92, 10, 24, 24);
        }
        doc.setFontSize(7);
        doc.setTextColor(0, 150, 136);
        doc.text('Zowar Taiba Land Transport', 104, 37, { align: 'center' });

        // Left QR Code
        if (qrCodeUrl) {
            doc.addImage(qrCodeUrl, 'PNG', 10, 10, 22, 22);
        }
    }

    // Helper: Draw common footer on a page
    function drawFooter(footerBarText) {
        // Line break dashed
        doc.setLineDashPattern([1, 1], 0);
        doc.line(10, 275, 200, 275);
        
        // Address & Contacts
        addArabicText(doc, 'المدينة المنورة - الدائري الثاني طريق الملك عبدالله - خلف محطة بيحان', 200, 279, { fontSize: 7, color: '#000000', align: 'right' });
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text('zawartaiba@gmail.com | 00966 50 484 5815', 10, 279, { align: 'left' });

        // Footer Bar
        doc.setFillColor(15, 76, 129);
        doc.rect(10, 282, 190, 8, 'F');
        addArabicText(doc, footerBarText, 198, 287, { fontSize: 7, color: '#ffffff', align: 'right' });
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text('Zowar Taiba Land Transport | C.R : 3500005546', 12, 287, { align: 'left' });
    }

    // Helper: Draw Section Title
    function drawSectionTitle(y, title) {
        doc.setFillColor(0, 150, 136); // Teal
        doc.rect(10, y, 190, 7, 'F');
        addArabicText(doc, title, 105, y + 5, { fontSize: 10, color: '#ffffff', fontStyle: 'bold', align: 'center' });
    }

    // ==========================================
    // PAGE 1: كشف الركاب
    // ==========================================
    let yPos = 43;
    drawHeader(1, data.qrUrl);
    
    // Doc Title
    addArabicText(doc, 'كشف الركاب', 105, yPos, { fontSize: 13, color: '#000000', fontStyle: 'bold', align: 'center' });
    yPos += 7;

    // General info row: render as separate addArabicText items
    // Use a plain gray box
    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPos, 190, 10, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.rect(10, yPos, 190, 10, 'S');
    addArabicText(doc, `اليوم: ${data.dayString}`, 70, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right' });
    addArabicText(doc, `التاريخ: ${data.dateString}`, 140, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right' });
    addArabicText(doc, `رقم الحجز: ${data.bookingId}`, 200, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right' });
    yPos += 14;

    // Driver Section Title
    drawSectionTitle(yPos, 'بيانات السائق');
    yPos += 9;

    // Driver Details: render as manual grid rows
    const driverRows = [
        ['الجوال', `${data.mobile}`, 'الهويه', `${data.nationalId}`, 'السائق', `${data.driverName}`],
        ['رقم اللوحه', `${data.plateNumber}`, 'اللون', `${data.carColor}`, 'السيارة', `${data.carModel}`]
    ];
    const colW = [20, 43, 20, 43, 20, 44];
    const colX = [10, 30, 73, 93, 136, 156];
    for (const row of driverRows) {
        let rowH = 8;
        // Draw border
        doc.setDrawColor(220, 220, 220);
        doc.rect(10, yPos, 190, rowH, 'S');
        // Draw cells
        for (let c = 0; c < 6; c++) {
            doc.rect(colX[c], yPos, colW[c], rowH, 'S');
            // Odd cols = label (Arabic), even cols = value
            addArabicText(doc, row[c], colX[c] + colW[c] - 1, yPos + 6, { fontSize: 8.5, color: '#000000', fontStyle: c % 2 === 0 ? 'bold' : 'normal', align: 'right' });
        }
        yPos += rowH;
    }
    yPos += 4;

    // Route Row
    doc.setDrawColor(220, 220, 220);
    doc.rect(10, yPos, 190, 8, 'S');
    doc.rect(10, yPos, 95, 8, 'S');
    doc.rect(105, yPos, 95, 8, 'S');
    addArabicText(doc, `جهة القدوم: ${data.source}`, 104, yPos + 6, { fontSize: 8.5, color: '#000000', align: 'right' });
    addArabicText(doc, `جهة الوصول: ${data.destination}`, 199, yPos + 6, { fontSize: 8.5, color: '#000000', align: 'right' });
    yPos += 12;

    // Guest Row
    doc.setDrawColor(220, 220, 220);
    doc.rect(10, yPos, 190, 8, 'S');
    doc.rect(10, yPos, 63, 8, 'S');
    doc.rect(73, yPos, 64, 8, 'S');
    doc.rect(137, yPos, 63, 8, 'S');
    addArabicText(doc, `الضيف: ${data.guestName}`, 72, yPos + 6, { fontSize: 8.5, color: '#000000', align: 'right' });
    addArabicText(doc, `الجوال: ${data.guestPhone}`, 136, yPos + 6, { fontSize: 8.5, color: '#000000', align: 'right' });
    addArabicText(doc, `رقم الرحله: ${data.flightNo}`, 199, yPos + 6, { fontSize: 8.5, color: '#000000', align: 'right' });
    yPos += 12;

    // Companions Title
    drawSectionTitle(yPos, 'بيانات المرافقين');
    yPos += 9;

    // Companions table header
    const hdrH = 7;
    const compCols = [8, 44, 28, 15, 8, 44, 28, 15]; // widths in mm
    const compHdrs = ['#', 'الاسم', 'رقم الهوية', 'الجنسية', '#', 'الاسم', 'رقم الهوية', 'الجنسية'];
    doc.setFillColor(0, 150, 136);
    let cx = 10;
    for (let c = 0; c < compCols.length; c++) {
        doc.rect(cx, yPos, compCols[c], hdrH, 'F');
        addArabicText(doc, compHdrs[c], cx + compCols[c] - 1, yPos + 5, { fontSize: 8, color: '#ffffff', fontStyle: 'bold', align: 'right' });
        cx += compCols[c];
    }
    yPos += hdrH;

    // Companion rows
    for (let i = 0; i < 6; i++) {
        const left = data.companions[i] || { name: '', id: '', nationality: '' };
        const right = data.companions[i + 6] || { name: '', id: '', nationality: '' };
        const rowVals = [
            String(i + 1), left.name, left.id, left.nationality,
            String(i + 7), right.name, right.id, right.nationality
        ];
        const rH = 7;
        cx = 10;
        doc.setDrawColor(200, 200, 200);
        for (let c = 0; c < compCols.length; c++) {
            doc.rect(cx, yPos, compCols[c], rH, 'S');
            if (rowVals[c]) {
                addArabicText(doc, rowVals[c], cx + compCols[c] - 1, yPos + 5, { fontSize: 7.5, color: '#000000', align: 'right' });
            }
            cx += compCols[c];
        }
        yPos += rH;
    }
    yPos += 4;

    // Important Notice block + Stamp
    addArabicText(doc, 'ملاحظة هامة', 105, yPos, { fontSize: 8.5, color: '#000000', fontStyle: 'bold', align: 'center' });
    yPos += 5;
    addArabicText(doc, 'في حالة عدم تطابق بيانات الضيف مع الاثبات تكن عرضه للجزاء وهذا تعهد منا بذلك', 105, yPos, { fontSize: 8, color: '#000000', align: 'center' });
    addArabicText(doc, 'شاكرين لكم حسن تعاونكم معنا', 105, yPos + 5, { fontSize: 8, color: '#000000', align: 'center' });

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
    addArabicText(doc, 'عقد نقل على الطرق البرية', 105, yPos, { fontSize: 13, color: '#000000', fontStyle: 'bold', align: 'center' });
    yPos += 7;

    // Date row
    doc.setFillColor(245, 245, 245);
    doc.rect(130, yPos, 70, 9, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.rect(130, yPos, 70, 9, 'S');
    addArabicText(doc, `التاريخ: ${data.dateString}`, 199, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right' });
    yPos += 16;

    // Legal Text (long paragraph - split into multiple lines)
    const legalText = 'تم ابرام هذا العقد بين المتعاقدين بناء على المادة (39) التاسعة والثلاثون من اللائحة المنظمة لنشاط النقل المتخصص وتأجير وتوجيه الحافلات';
    addArabicText(doc, legalText, 200, yPos, { fontSize: 9, color: '#000000', align: 'right' });
    yPos += 10;
    const legalText2 = 'بناء على الفقرة (1) من المادة (39) والتي تنص على أن يجب على الناقل ابرام عقد نقل مع الأطراف المحددين في المادة (40) قبل تنفيذ عمليات النقل على الطرق البرية';
    addArabicText(doc, legalText2, 200, yPos, { fontSize: 9, color: '#000000', align: 'right' });
    yPos += 10;
    const legalText3 = 'وبناء على ما سبق تم ابرام عقد النقل بين الأطراف الآتية:';
    addArabicText(doc, legalText3, 200, yPos, { fontSize: 9, color: '#000000', align: 'right' });
    yPos += 10;

    // Parties
    addArabicText(doc, `الطرف الأول / مؤسسة زوار طيبة للنقل البري ترخيص رقم - 3500005546`, 200, yPos, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right' });
    yPos += 7;
    addArabicText(doc, `الطرف الثاني / ${data.guestName}`, 200, yPos, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right' });
    yPos += 12;

    // Description text
    addArabicText(doc, 'اتفق الطرفان على ان ينفذ الطرف الأول عملية النقل للطرف الثاني مع مرافقيه وذويهم من الموقع المحدد مسبقاً وتوصيلهم الى الجهه المحدده بالعقد.', 200, yPos, { fontSize: 9, color: '#000000', align: 'right' });
    yPos += 10;

    // Route Details
    doc.setDrawColor(220, 220, 220);
    doc.rect(10, yPos, 190, 10, 'S');
    doc.rect(10, yPos, 95, 10, 'S');
    addArabicText(doc, `النقل من: ${data.source}`, 104, yPos + 7, { fontSize: 9, color: '#000000', align: 'right' });
    addArabicText(doc, `وصولاً الى: ${data.destination}`, 199, yPos + 7, { fontSize: 9, color: '#000000', align: 'right' });
    yPos += 18;

    // Terms
    addArabicText(doc, 'في حال الغاء التعاقد لاي سبب شخصي او اسباب اخرى تتعلق في الحجوزات او الانظمة تكون سياسة الالغاء والاستبدال حسب نظام وزارة التجارة السعودي.', 200, yPos, { fontSize: 9, color: '#000000', align: 'right' });
    yPos += 10;
    addArabicText(doc, 'في حال الحجز وتم الالغاء قبل موعد الرحلة باكثر من 24 ساعة يتم استرداد المبلغ كامل.', 200, yPos, { fontSize: 9, color: '#000000', align: 'right' });
    yPos += 10;
    addArabicText(doc, 'في حالة طلب الحجز من خلال الموقع الالكتروني يعتبر الحجز وموافقته على الشروط الاحكام موافقة على هذا العقد.', 200, yPos, { fontSize: 9, color: '#000000', align: 'right' });

    drawFooter('امر تشغيل شامل كشف الركاب تم إصداره إلكترونيا من السيستم');

    // ==========================================
    // PAGE 3: سجل الفحص اليومي للسيارة
    // ==========================================
    doc.addPage();
    drawHeader(3, data.qrUrl);
    yPos = 43;

    // Doc Title
    addArabicText(doc, 'سجل الفحص اليومي للسيارة', 105, yPos, { fontSize: 13, color: '#000000', fontStyle: 'bold', align: 'center' });
    yPos += 7;

    // Metadata rows
    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPos, 190, 9, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.rect(10, yPos, 190, 9, 'S');
    addArabicText(doc, `التاريخ: ${data.dateString}`, 104, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right' });
    addArabicText(doc, `رقم الحجز: ${data.bookingId}`, 199, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right' });
    yPos += 12;

    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPos, 190, 9, 'F');
    doc.rect(10, yPos, 190, 9, 'S');
    addArabicText(doc, `السائق: ${data.driverName}`, 104, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right' });
    addArabicText(doc, `رقم اللوحه: ${data.plateNumber}`, 199, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right' });
    yPos += 12;

    // Helper to generate inspection table using canvas-based text
    function makeInspectionTable(title, items, y) {
        addArabicText(doc, title, 200, y + 4, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right' });
        y += 7;
        
        // Header row
        const iCols = [90, 25, 25, 50]; // widths
        const iX    = [10, 100, 125, 150];
        const iHdrs = ['البند', 'سليم', 'غير سليم', 'ملاحظات'];
        doc.setFillColor(235, 235, 235);
        for (let c = 0; c < 4; c++) {
            doc.rect(iX[c], y, iCols[c], 6, 'F');
            doc.rect(iX[c], y, iCols[c], 6, 'S');
            addArabicText(doc, iHdrs[c], iX[c] + iCols[c] - 1, y + 4.5, { fontSize: 7.5, color: '#000000', fontStyle: 'bold', align: 'right' });
        }
        y += 6;
        
        // Item rows
        for (const item of items) {
            for (let c = 0; c < 4; c++) {
                doc.rect(iX[c], y, iCols[c], 6, 'S');
            }
            addArabicText(doc, item, iX[0] + iCols[0] - 1, y + 4.5, { fontSize: 7.5, color: '#000000', align: 'right' });
            // Checkmark in 'Salim' column
            doc.setTextColor(0, 150, 136);
            doc.setFontSize(8);
            doc.text('✓', iX[1] + iCols[1] / 2, y + 4, { align: 'center' });
            doc.setTextColor(0, 0, 0);
            y += 6;
        }
        return y;
    }

    yPos = makeInspectionTable('أولاً - فحص مؤشرات لوحة القيادة', [
        'مؤشر الوقود', 'مؤشر الحرارة', 'مؤشر ضغط الزيت', 'لمبة فحص المحرك', 'ABS', 'لمبات التحذير'
    ], yPos);

    yPos = makeInspectionTable('ثانياً - الفحص الخارجي', [
        'الإطارات وضغط الهواء', 'الأنوار الأمامية والخلفية', 'الإشارات التحذيرية', 'الزجاج والمرايا', 'عدم وجود تسريبات'
    ], yPos + 4);

    yPos = makeInspectionTable('ثالثاً - أدوات ومتمتلكات الأمن والسلامة', [
        'طفاية حريق', 'مثلث تحذير', 'حقيبة إسعافات أولية', 'مطرقة كسر الزجاج', 'أحزمة الأمان'
    ], yPos + 4);

    yPos += 5;

    // Declaration Box
    doc.setDrawColor(0, 0, 0);
    doc.rect(10, yPos, 190, 18, 'S');
    addArabicText(doc, 'إقرار', 199, yPos + 6, { fontSize: 8.5, color: '#000000', fontStyle: 'bold', align: 'right' });
    addArabicText(doc, 'أقر أنا السائق أعلاه بأنني قمت بفحص الحافلة والتأكد من سلامتها وجاهزيتها قبل التشغيل.', 199, yPos + 13, { fontSize: 8, color: '#000000', align: 'right' });
    yPos += 24;

    // Signature
    addArabicText(doc, `اسم السائق - ${data.driverName}`, 15, yPos, { fontSize: 9, color: '#000000', align: 'left' });

    drawFooter('سجل فحص يومي للسيارة تم إصداره إلكترونيا من السيستم');

    return doc;
}
