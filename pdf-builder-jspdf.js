// Arabic Glyph Table mapping standard Arabic characters to their contextual forms [Medial, Initial, Final, Isolated]
const ARABIC_GLYPHS = {
    0x0621: [0xFE80, 0xFE80, 0xFE80, 0xFE80], // Hamza
    0x0622: [0xFE82, 0xFE82, 0xFE82, 0xFE81], // Alef Mad
    0x0623: [0xFE84, 0xFE84, 0xFE84, 0xFE83], // Alef Hamza Above
    0x0624: [0xFE86, 0xFE86, 0xFE86, 0xFE85], // Waw Hamza
    0x0625: [0xFE88, 0xFE88, 0xFE88, 0xFE87], // Alef Hamza Below
    0x0626: [0xFE8C, 0xFE8B, 0xFE8A, 0xFE89], // Yeh Hamza
    0x0627: [0xFE8E, 0xFE8E, 0xFE8E, 0xFE8D], // Alef
    0x0628: [0xFE92, 0xFE91, 0xFE90, 0xFE8F], // Beh
    0x0629: [0xFE94, 0xFE94, 0xFE94, 0xFE93], // Teh Marbuta
    0x062A: [0xFE98, 0xFE97, 0xFE96, 0xFE95], // Teh
    0x062B: [0xFE9C, 0xFE9B, 0xFE9A, 0xFE99], // Theh
    0x062C: [0xFEA0, 0xFE9F, 0xFE9E, 0xFE9D], // Jeem
    0x062D: [0xFEA4, 0xFEA3, 0xFEA2, 0xFEA1], // Hah
    0x062E: [0xFEA8, 0xFEA7, 0xFEA6, 0xFEA5], // Khah
    0x062F: [0xFEAA, 0xFEAA, 0xFEAA, 0xFEA9], // Dal
    0x0630: [0xFEAC, 0xFEAC, 0xFEAC, 0xFEAB], // Thal
    0x0631: [0xFEAE, 0xFEAE, 0xFEAE, 0xFEAD], // Reh
    0x0632: [0xFEB0, 0xFEB0, 0xFEB0, 0xFEAF], // Zain
    0x0633: [0xFEB4, 0xFEB3, 0xFEB2, 0xFEB1], // Seen
    0x0634: [0xFEB8, 0xFEB7, 0xFEB6, 0xFEB5], // Sheen
    0x0635: [0xFEBC, 0xFEBB, 0xFEBA, 0xFEB9], // Sad
    0x0636: [0xFEC0, 0xFEBF, 0xFEBE, 0xFEBD], // Dad
    0x0637: [0xFEC4, 0xFEC3, 0xFEC2, 0xFEC1], // Tah
    0x0638: [0xFEC8, 0xFEC7, 0xFEC6, 0xFEC5], // Zah
    0x0639: [0xFECC, 0xFECB, 0xFECA, 0xFEC9], // Ain
    0x063A: [0xFED0, 0xFECF, 0xFECE, 0xFECD], // Ghain
    0x0641: [0xFED4, 0xFED3, 0xFED2, 0xFED1], // Feh
    0x0642: [0xFED8, 0xFED7, 0xFED6, 0xFED5], // Qah
    0x0643: [0xFEDC, 0xFEDB, 0xFEDA, 0xFED9], // Kaf
    0x0644: [0xFEE0, 0xFEDF, 0xFEDE, 0xFEDD], // Lam
    0x0645: [0xFEE4, 0xFEE3, 0xFEE2, 0xFEE1], // Meem
    0x0646: [0xFEE8, 0xFEE7, 0xFEE6, 0xFEE5], // Noon
    0x0647: [0xFEEC, 0xFEEB, 0xFEEA, 0xFEE9], // Heh
    0x0648: [0xFEEE, 0xFEEE, 0xFEEE, 0xFEED], // Waw
    0x0649: [0xFEF0, 0xFEF0, 0xFEF0, 0xFEEF], // Alef Maksura
    0x064A: [0xFEF4, 0xFEF3, 0xFEF2, 0xFEF1], // Yeh
    
    // Lam-Alef Ligatures
    0xFEFB: [0xFEFC, 0xFEFC, 0xFEFC, 0xFEFB], // Lam-Alef
    0xFEF7: [0xFEF8, 0xFEF8, 0xFEF8, 0xFEF7], // Lam-Alef Hamza Above
    0xFEF9: [0xFEFA, 0xFEFA, 0xFEFA, 0xFEF9], // Lam-Alef Hamza Below
    0xFEF5: [0xFEF6, 0xFEF6, 0xFEF6, 0xFEF5]  // Lam-Alef Mad
};

function canConnectRight(ch) {
    if (!ch) return false;
    const code = ch.charCodeAt(0);
    if (code === 0x0621) return false; // Hamza
    return !!ARABIC_GLYPHS[code];
}

function canConnectLeft(ch) {
    if (!ch) return false;
    const code = ch.charCodeAt(0);
    const nonLeft = [
        0x0621, // Hamza
        0x0622, 0x0623, 0x0625, 0x0627, // Alef variations
        0x062F, // Dal
        0x0630, // Thal
        0x0631, // Reh
        0x0632, // Zain
        0x0648, // Waw
        0x0649, // Alef Maksura
        0x0629,  // Teh Marbuta
        0xFEFB, 0xFEF7, 0xFEF9, 0xFEF5 // Lam-Alef Ligatures
    ];
    if (nonLeft.includes(code)) return false;
    return !!ARABIC_GLYPHS[code];
}

function reshapeArabicText(text) {
    if (!text) return '';
    let result = '';
    const len = text.length;
    for (let i = 0; i < len; i++) {
        const code = text.charCodeAt(i);
        const forms = ARABIC_GLYPHS[code];
        if (forms) {
            const prev = i > 0 ? text[i - 1] : null;
            const next = i < len - 1 ? text[i + 1] : null;
            
            const connectPrev = prev && canConnectLeft(prev) && canConnectRight(text[i]);
            const connectNext = next && canConnectRight(next) && canConnectLeft(text[i]);
            
            let formIndex = 3; // Isolated
            if (connectPrev && connectNext) {
                formIndex = 0; // Medial
            } else if (connectNext) {
                formIndex = 1; // Initial
            } else if (connectPrev) {
                formIndex = 2; // Final
            }
            result += String.fromCharCode(forms[formIndex]);
        } else {
            result += text[i];
        }
    }
    return result;
}

function fixArabicText(text) {
    if (text === undefined || text === null) return '';
    const str = text.toString();
    
    // Preprocess Lam-Alef
    let prepared = str
        .replace(/لآ/g, '\uFEF5')
        .replace(/لأ/g, '\uFEF7')
        .replace(/لإ/g, '\uFEF9')
        .replace(/لا/g, '\uFEFB');

    // Reshape characters to their connected forms
    const reshaped = reshapeArabicText(prepared);

    // Identify runs of Arabic vs. Non-Arabic
    const isArabicChar = (ch) => {
        const code = ch.charCodeAt(0);
        return (code >= 0x0600 && code <= 0x06FF) || 
               (code >= 0xFE70 && code <= 0xFEFF) || 
               (code >= 0xFB50 && code <= 0xFDFF);
    };

    let runs = [];
    let currentRun = '';
    let currentIsArabic = null;

    for (let i = 0; i < reshaped.length; i++) {
        const ch = reshaped[i];
        const isAr = isArabicChar(ch);
        
        if (currentIsArabic === null) {
            currentIsArabic = isAr;
            currentRun = ch;
        } else if (currentIsArabic === isAr) {
            currentRun += ch;
        } else {
            runs.push({ text: currentRun, isArabic: currentIsArabic });
            currentIsArabic = isAr;
            currentRun = ch;
        }
    }
    if (currentRun) {
        runs.push({ text: currentRun, isArabic: currentIsArabic });
    }

    // Process each run:
    // - Arabic runs: reverse the characters
    // - Non-Arabic runs (like numbers/English): keep original character order
    const processedRuns = runs.map(run => {
        if (run.isArabic) {
            return run.text.split('').reverse().join('');
        }
        return run.text;
    });

    // Reverse the order of all runs so the entire line reads RTL
    return processedRuns.reverse().join('');
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

    // Override the text method for this specific instance to support RTL and shaping
    const originalText = doc.text;
    doc.text = function(text, x, y, options) {
        if (typeof text === 'string') {
            text = fixArabicText(text);
        } else if (Array.isArray(text)) {
            text = text.map(t => typeof t === 'string' ? fixArabicText(t) : t);
        }
        return originalText.call(doc, text, x, y, options);
    };

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
