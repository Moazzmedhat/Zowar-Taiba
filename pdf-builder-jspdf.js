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
/**
 * Render Arabic text to a canvas and return as base64 PNG/JPEG data URL.
 * The browser handles all Arabic shaping (connecting letters) and RTL direction natively.
 * 
 * @param {string} text - The Arabic text to render
 * @param {number} fontSize - Font size in pixels
 * @param {string} color - CSS color string (e.g. '#000000')
 * @param {string} fontWeight - 'normal' or 'bold'
 * @param {boolean} transparent - Force transparent PNG format
 * @returns {{ dataUrl: string, format: string, widthPx: number, heightPx: number }}
 */
function renderArabicToCanvas(text, fontSize, color, fontWeight, transparent) {
    if (!text) return null;
    try {
        const scale = 4; // High-resolution retina scale for maximum sharpness
        const fontStr = `${fontWeight || 'normal'} ${fontSize * scale}px ${arabicCanvasFont}`;
        
        // Measure text width
        const measurer = document.createElement('canvas');
        const mctx = measurer.getContext('2d');
        if (!mctx) return null;
        mctx.font = fontStr;
        const metrics = mctx.measureText(text);
        const textWidthPx = Math.ceil(metrics.width || 10) + 24; // padding
        const textHeightPx = Math.ceil(fontSize * scale * 1.5);
        
        // Render text
        const canvas = document.createElement('canvas');
        canvas.width = textWidthPx;
        canvas.height = textHeightPx;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        const isWhiteText = (color && (color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#fff' || color.toLowerCase() === 'white'));
        const usePng = transparent || isWhiteText;
        
        if (!usePng) {
            // Fill canvas with white background for black text to allow high JPEG compression
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, textWidthPx, textHeightPx);
        }
        
        ctx.font = fontStr;
        ctx.fillStyle = color || '#000000';
        ctx.textBaseline = 'middle';
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';
        ctx.fillText(text, textWidthPx - 5, textHeightPx / 2);
        
        return {
            // Use transparent PNG when requested, JPEG for normal black text to keep file size tiny
            dataUrl: usePng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85),
            format: usePng ? 'PNG' : 'JPEG',
            widthPx: textWidthPx,
            heightPx: textHeightPx
        };
    } catch (e) {
        console.error("Canvas rendering failed:", e);
        return null;
    }
}

/**
 * Add Arabic text to a jsPDF document as a canvas-rendered image.
 * This completely bypasses jsPDF's font system for Arabic text.
 * 
 * @param {object} doc - jsPDF document instance
 * @param {string} text - Arabic text string
 * @param {number} xMm - X position in mm (right edge for RTL, or use align)
 * @param {number} yMm - Y position in mm (baseline)
 * @param {object} options - { fontSize, color, fontStyle, align, transparent }
 * @returns {number} - width of rendered image in mm
 */
function addArabicText(doc, text, xMm, yMm, options = {}) {
    if (!text || !text.toString().trim()) return 0;
    
    try {
        const str = text.toString();
        let fontSize = options.fontSize;
        if (!fontSize) {
            try {
                fontSize = doc.getFontSize();
            } catch (e) {
                fontSize = 10;
            }
        }
        const color = options.color || '#000000';
        const fontWeight = (options.fontStyle === 'bold') ? 'bold' : 'normal';
        const align = options.align || 'right';
        const transparent = options.transparent || false;
        
        const rendered = renderArabicToCanvas(str, fontSize * 1.5, color, fontWeight, transparent);
        if (!rendered) {
            // Fallback to basic text if canvas fails
            doc.text(str, xMm, yMm, { align: align });
            return 10;
        }
        
        // Convert pixels to mm (at 96 DPI: 1mm = 3.7795px; we used scale=4 so actual px / 4 / 3.7795)
        const scale = 4;
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
        
        doc.addImage(rendered.dataUrl, rendered.format, drawX, drawY, widthMm, heightMm);
        return widthMm;
    } catch (err) {
        console.error("addArabicText error:", err);
        // Absolute fallback to avoid PDF crash
        try {
            doc.text(text.toString(), xMm, yMm, { align: options.align || 'right' });
        } catch (inner) {}
        return 10;
    }
}



/**
 * Render a long Arabic paragraph that wraps to fit within maxWidthMm.
 * Returns the final Y position after all lines are drawn.
 */
function addArabicParagraph(doc, text, xMm, yMm, options = {}) {
    if (!text || !text.toString().trim()) return yMm;

    const fontSize = options.fontSize || 10;
    const lineHeight = options.lineHeight || (fontSize * 0.45 + 2);
    const maxWidthMm = options.maxWidthMm || 190;
    const scale = 4;
    const fontWeight = (options.fontStyle === 'bold') ? 'bold' : 'normal';
    const fontStr = `${fontWeight} ${fontSize * 1.5 * scale}px ${arabicCanvasFont}`;

    // Use canvas to measure word widths
    const measurer = document.createElement('canvas');
    const mctx = measurer.getContext('2d');
    mctx.font = fontStr;

    const pxToMm = 1 / (3.7795 * scale);
    const maxWidthPx = maxWidthMm / pxToMm;

    // Split text into words and build lines
    const words = text.toString().split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const testWidth = mctx.measureText(testLine).width;
        if (testWidth > maxWidthPx && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);

    // Draw each line
    let y = yMm;
    for (const line of lines) {
        addArabicText(doc, line, xMm, y, options);
        y += lineHeight;
    }
    return y;
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
        format: 'a4',
        compress: true // Enable document-wide zip compression to reduce output file size
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

    // Helper: Draw Page Doc Title in a bordered box centered under logo
    function drawDocTitle(title) {
        // Box: centered horizontally, width 100mm, height 9mm
        const boxW = 100, boxH = 9;
        const boxX = (210 - boxW) / 2; // centered on A4 (210mm wide)
        const boxY = 39;
        doc.setDrawColor(0, 150, 136);
        doc.setLineWidth(0.5);
        doc.rect(boxX, boxY, boxW, boxH, 'S');
        doc.setLineWidth(0.2);
        addArabicText(doc, title, 105, boxY + 6.5, { fontSize: 12, color: '#009688', fontStyle: 'bold', align: 'center', transparent: true });
    }

    // ==========================================
    // PAGE 1: كشف الركاب
    // ==========================================
    let yPos = 43;
    drawHeader(1, data.qrUrl);
    
    // Doc Title
    drawDocTitle('كشف الركاب');
    yPos = 52;

    // General info row: divided into 3 equal centered sections to fill the box beautifully
    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPos, 190, 10, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.rect(10, yPos, 190, 10, 'S');
    
    // Width is 190mm total. Three centers at: 10 + 190/6, 10 + 190/2, 10 + 5*190/6
    addArabicText(doc, `اليوم: ${data.dayString}`, 10 + 190/6, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'center', transparent: true });
    addArabicText(doc, `التاريخ: ${data.dateString}`, 10 + 190/2, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'center', transparent: true });
    addArabicText(doc, `رقم الحجز: ${data.bookingId}`, 10 + 5*190/6, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'center', transparent: true });
    yPos += 14;

    // Driver Section Title
    drawSectionTitle(yPos, 'بيانات السائق');
    yPos += 9;

    // Driver Details: render as manual grid rows (Value on Left, Label on Right)
    const driverRows = [
        [`${data.mobile}`, 'الجوال', `${data.nationalId}`, 'الهويه', `${data.driverName}`, 'السائق'],
        [`${data.plateNumber}`, 'رقم اللوحه', `${data.carColor}`, 'اللون', `${data.carModel}`, 'السيارة']
    ];
    const colW = [43, 20, 43, 20, 44, 20];
    const colX = [10, 53, 73, 116, 136, 180];
    for (const row of driverRows) {
        let rowH = 8;
        // Draw border
        doc.setDrawColor(220, 220, 220);
        doc.rect(10, yPos, 190, rowH, 'S');
        // Draw cells
        for (let c = 0; c < 6; c++) {
            doc.rect(colX[c], yPos, colW[c], rowH, 'S');
            // Center the text inside the cell (x = colX + colW / 2)
            const centerX = colX[c] + colW[c] / 2;
            addArabicText(doc, row[c], centerX, yPos + 6, { fontSize: 8.5, color: '#000000', fontStyle: c % 2 === 1 ? 'bold' : 'normal', align: 'center', transparent: true });
        }
        yPos += rowH;
    }
    yPos += 4;

    // Route Row (Separated Label and Value cells)
    const routeCols = [65, 30, 65, 30];
    const routeX = [10, 75, 105, 170];
    const routeVals = [`${data.source}`, 'جهة القدوم', `${data.destination}`, 'جهة الوصول'];
    doc.setDrawColor(220, 220, 220);
    doc.rect(10, yPos, 190, 8, 'S');
    for (let c = 0; c < 4; c++) {
        doc.rect(routeX[c], yPos, routeCols[c], 8, 'S');
        const centerX = routeX[c] + routeCols[c] / 2;
        addArabicText(doc, routeVals[c], centerX, yPos + 6, { fontSize: 8.5, color: '#000000', fontStyle: c % 2 === 1 ? 'bold' : 'normal', align: 'center', transparent: true });
    }
    yPos += 12;

    // Guest Row (Separated Label and Value cells matching the driver grid)
    const guestCols = [43, 20, 43, 20, 44, 20];
    const guestX = [10, 53, 73, 116, 136, 180];
    const guestVals = [`${data.flightNo}`, 'رقم الرحله', `${data.guestPhone}`, 'الجوال', `${data.guestName}`, 'الضيف'];
    doc.setDrawColor(220, 220, 220);
    doc.rect(10, yPos, 190, 8, 'S');
    for (let c = 0; c < 6; c++) {
        doc.rect(guestX[c], yPos, guestCols[c], 8, 'S');
        const centerX = guestX[c] + guestCols[c] / 2;
        addArabicText(doc, guestVals[c], centerX, yPos + 6, { fontSize: 8.5, color: '#000000', fontStyle: c % 2 === 1 ? 'bold' : 'normal', align: 'center', transparent: true });
    }
    yPos += 12;

    // Companions Title
    drawSectionTitle(yPos, 'بيانات المرافقين');
    yPos += 9;

    // Companions table header (RTL structure: Right side represents items 1-6, Left side represents items 7-12)
    const hdrH = 7;
    const compCols = [15, 28, 44, 8, 15, 28, 44, 8]; // widths in mm (Left block: 15, 28, 44, 8 | Right block: 15, 28, 44, 8)
    const compHdrs = ['الجنسية', 'رقم الهوية', 'الاسم', '#', 'الجنسية', 'رقم الهوية', 'الاسم', '#'];
    doc.setFillColor(0, 150, 136);
    let cx = 10;
    for (let c = 0; c < compCols.length; c++) {
        doc.rect(cx, yPos, compCols[c], hdrH, 'F');
        const centerX = cx + compCols[c] / 2;
        addArabicText(doc, compHdrs[c], centerX, yPos + 5, { 
            fontSize: 8, 
            color: '#ffffff', 
            fontStyle: 'bold', 
            align: 'center' 
        });
        cx += compCols[c];
    }
    yPos += hdrH;

    // Companion rows
    for (let i = 0; i < 6; i++) {
        const left = data.companions[i] || { name: '', id: '', nationality: '' }; // Items 1-6
        const right = data.companions[i + 6] || { name: '', id: '', nationality: '' }; // Items 7-12
        const rowVals = [
            right.nationality, right.id, right.name, String(i + 7), // Left side of page (items 7-12)
            left.nationality, left.id, left.name, String(i + 1)     // Right side of page (items 1-6)
        ];
        const rH = 7;
        cx = 10;
        doc.setDrawColor(200, 200, 200);
        for (let c = 0; c < compCols.length; c++) {
            doc.rect(cx, yPos, compCols[c], rH, 'S');
            if (rowVals[c]) {
                const centerX = cx + compCols[c] / 2;
                addArabicText(doc, rowVals[c], centerX, yPos + 5, { 
                    fontSize: 7.5, 
                    color: '#000000', 
                    align: 'center',
                    transparent: true
                });
            }
            cx += compCols[c];
        }
        yPos += rH;
    }
    yPos += 12;

    // Important Notice block + Stamp
    addArabicText(doc, 'ملاحظة هامة', 105, yPos, { fontSize: 8.5, color: '#000000', fontStyle: 'bold', align: 'center' });
    yPos += 5;
    addArabicText(doc, 'في حالة عدم تطابق بيانات الضيف مع الاثبات تكن عرضه للجزاء وهذا تعهد منا بذلك', 105, yPos, { fontSize: 8, color: '#000000', align: 'center' });
    addArabicText(doc, 'شاكرين لكم حسن تعاونكم معنا', 105, yPos + 5, { fontSize: 8, color: '#000000', align: 'center' });

    // Official Stamp
    if (stampBase64) {
        doc.addImage(stampBase64, 'PNG', 10, yPos - 10, 35, 35);
    }

    drawFooter('امر تشغيل شامل كشف الركاب تم إصداره إلكترونيا من السيستم');

    // ==========================================
    // PAGE 2: عقد نقل الطرق البرية
    // ==========================================
    doc.addPage();
    drawHeader(2, data.qrUrl);
    yPos = 43;

    // Doc Title
    drawDocTitle('عقد نقل على الطرق البرية');
    yPos = 52;

    // Date row
    doc.setFillColor(245, 245, 245);
    doc.rect(130, yPos, 70, 10, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.rect(130, yPos, 70, 10, 'S');
    addArabicText(doc, `التاريخ: ${data.dateString}`, 199, yPos + 7.5, { fontSize: 10, color: '#000000', fontStyle: 'bold', align: 'right', transparent: true });
    yPos += 18;

    // Legal Text - properly wrapped to fill page width
    yPos = addArabicParagraph(doc, 'تم ابرام هذا العقد بين المتعاقدين بناء على المادة (39) التاسعة والثلاثون من اللائحة المنظمة لنشاط النقل المتخصص وتأجير وتوجيه الحافلات', 200, yPos, { fontSize: 11, color: '#000000', align: 'right', maxWidthMm: 190, lineHeight: 8 });
    yPos += 3;
    yPos = addArabicParagraph(doc, 'بناء على الفقرة (1) من المادة (39) والتي تنص على أن يجب على الناقل ابرام عقد نقل مع الأطراف المحددين في المادة (40) قبل تنفيذ عمليات النقل على الطرق البرية', 200, yPos, { fontSize: 11, color: '#000000', align: 'right', maxWidthMm: 190, lineHeight: 8 });
    yPos += 3;
    addArabicText(doc, 'وبناء على ما سبق تم ابرام عقد النقل بين الأطراف الآتية:', 200, yPos, { fontSize: 11, color: '#000000', align: 'right' });
    yPos += 12;

    // Parties
    addArabicText(doc, `الطرف الأول / مؤسسة زوار طيبة للنقل البري ترخيص رقم - 3500005546`, 200, yPos, { fontSize: 11, color: '#000000', fontStyle: 'bold', align: 'right' });
    yPos += 9;
    addArabicText(doc, `الطرف الثاني / ${data.guestName}`, 200, yPos, { fontSize: 11, color: '#000000', fontStyle: 'bold', align: 'right' });
    yPos += 14;

    // Description text
    yPos = addArabicParagraph(doc, 'اتفق الطرفان على ان ينفذ الطرف الأول عملية النقل للطرف الثاني مع مرافقيه وذويهم من الموقع المحدد مسبقاً وتوصيلهم الى الجهه المحدده بالعقد.', 200, yPos, { fontSize: 11, color: '#000000', align: 'right', maxWidthMm: 190, lineHeight: 8 });
    yPos += 6;

    // Route Details
    doc.setDrawColor(220, 220, 220);
    doc.rect(10, yPos, 190, 11, 'S');
    doc.rect(10, yPos, 95, 11, 'S');
    addArabicText(doc, `النقل من: ${data.source}`, 104, yPos + 8, { fontSize: 11, color: '#000000', align: 'right', transparent: true });
    addArabicText(doc, `وصولاً الى: ${data.destination}`, 199, yPos + 8, { fontSize: 11, color: '#000000', align: 'right', transparent: true });
    yPos += 20;

    // Terms
    yPos = addArabicParagraph(doc, 'في حال الغاء التعاقد لاي سبب شخصي او اسباب اخرى تتعلق في الحجوزات او الانظمة تكون سياسة الالغاء والاستبدال حسب نظام وزارة التجارة السعودي.', 200, yPos, { fontSize: 11, color: '#000000', align: 'right', maxWidthMm: 190, lineHeight: 8 });
    yPos += 4;
    addArabicText(doc, 'في حال الحجز وتم الالغاء قبل موعد الرحلة باكثر من 24 ساعة يتم استرداد المبلغ كامل.', 200, yPos, { fontSize: 11, color: '#000000', align: 'right' });
    yPos += 9;
    yPos = addArabicParagraph(doc, 'في حالة طلب الحجز من خلال الموقع الالكتروني يعتبر الحجز وموافقته على الشروط الاحكام موافقة على هذا العقد.', 200, yPos, { fontSize: 11, color: '#000000', align: 'right', maxWidthMm: 190, lineHeight: 8 });

    // Official Stamp
    if (stampBase64) {
        doc.addImage(stampBase64, 'PNG', 10, yPos + 2, 35, 35);
    }

    drawFooter('امر تشغيل شامل كشف الركاب تم إصداره إلكترونيا من السيستم');

    // ==========================================
    // PAGE 3: سجل الفحص اليومي للسيارة
    // ==========================================
    doc.addPage();
    drawHeader(3, data.qrUrl);
    yPos = 43;

    // Doc Title
    drawDocTitle('سجل الفحص اليومي للسيارة');
    yPos = 52;

    // Metadata rows
    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPos, 190, 9, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.rect(10, yPos, 190, 9, 'S');
    addArabicText(doc, `التاريخ: ${data.dateString}`, 104, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right', transparent: true });
    addArabicText(doc, `رقم الحجز: ${data.bookingId}`, 199, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right', transparent: true });
    yPos += 12;

    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPos, 190, 9, 'F');
    doc.rect(10, yPos, 190, 9, 'S');
    addArabicText(doc, `السائق: ${data.driverName}`, 104, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right', transparent: true });
    addArabicText(doc, `رقم اللوحه: ${data.plateNumber}`, 199, yPos + 7, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right', transparent: true });
    yPos += 12;

    // Helper to generate inspection table using canvas-based text
    function makeInspectionTable(title, items, y) {
        addArabicText(doc, title, 200, y + 4, { fontSize: 9, color: '#000000', fontStyle: 'bold', align: 'right' });
        y += 7;
        
        // Header row (RTL flow: Notes, Not Salim, Salim, Item)
        const iCols = [50, 25, 25, 90]; // widths
        const iX    = [10, 60, 85, 110];
        const iHdrs = ['ملاحظات', 'غير سليم', 'سليم', 'البند'];
        doc.setFillColor(235, 235, 235);
        for (let c = 0; c < 4; c++) {
            doc.rect(iX[c], y, iCols[c], 6, 'F');
            doc.rect(iX[c], y, iCols[c], 6, 'S');
            const centerX = iX[c] + iCols[c] / 2;
            addArabicText(doc, iHdrs[c], centerX, y + 4.5, { fontSize: 7.5, color: '#000000', fontStyle: 'bold', align: 'center', transparent: true });
        }
        y += 6;
        
        // Item rows
        for (const item of items) {
            for (let c = 0; c < 4; c++) {
                doc.rect(iX[c], y, iCols[c], 6, 'S');
            }
            // Draw item name centered in 'البند' column (index 3) - set transparent: true to prevent white box overlapping grid borders
            const itemCenterX = iX[3] + iCols[3] / 2;
            addArabicText(doc, item, itemCenterX, y + 4.5, { fontSize: 7.5, color: '#000000', align: 'center', transparent: true });
            
            // Draw a beautiful checkmark '✓' using Canvas (index 2)
            addArabicText(doc, '✓', iX[2] + iCols[2] / 2, y + 4.5, { fontSize: 9, color: '#009688', fontStyle: 'bold', align: 'center', transparent: true });
            
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

    // Signature (right side)
    addArabicText(doc, `اسم السائق - ${data.driverName}`, 199, yPos + 6, { fontSize: 9, color: '#000000', align: 'right' });

    // Official Stamp (left side)
    if (stampBase64) {
        doc.addImage(stampBase64, 'PNG', 10, yPos - 3, 25, 25);
    }

    drawFooter('سجل فحص يومي للسيارة تم إصداره إلكترونيا من السيستم');

    return doc;
}
