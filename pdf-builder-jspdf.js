// Arabic glyph joining maps (isolated, end, middle, beginning)
const ARABIC_GLYPHS = {
    0x0621: [0xFE80, 0xFE80, 0xFE80, 0xFE80], // Hamza
    0x0622: [0xFE82, 0xFE82, 0xFE81, 0xFE81], // Alef Mad
    0x0623: [0xFE84, 0xFE84, 0xFE83, 0xFE83], // Alef Hamza Above
    0x0624: [0xFE86, 0xFE86, 0xFE85, 0xFE85], // Waw Hamza
    0x0625: [0xFE88, 0xFE88, 0xFE87, 0xFE87], // Alef Hamza Below
    0x0626: [0xFE8C, 0xFE8B, 0xFE8A, 0xFE89], // Yeh Hamza
    0x0627: [0xFE8E, 0xFE8E, 0xFE8D, 0xFE8D], // Alef
    0x0628: [0xFE92, 0xFE91, 0xFE90, 0xFE8F], // Beh
    0x0629: [0xFE94, 0xFE94, 0xFE93, 0xFE93], // Teh Marbuta
    0x062A: [0xFE98, 0xFE97, 0xFE96, 0xFE95], // Teh
    0x062B: [0xFE9C, 0xFE9B, 0xFE9A, 0xFE99], // Theh
    0x062C: [0xFEA0, 0xFE9F, 0xFE9E, 0xFE9D], // Jeem
    0x062D: [0xFEA4, 0xFEA3, 0xFEA2, 0xFEA1], // Hah
    0x062E: [0xFEA8, 0xFEA7, 0xFEA6, 0xFEA5], // Khah
    0x062F: [0xFEAA, 0xFEAA, 0xFEA9, 0xFEA9], // Dal
    0x0630: [0xFEAC, 0xFEAC, 0xFEAB, 0xFEAB], // Thal
    0x0631: [0xFEAE, 0xFEAE, 0xFEAD, 0xFEAD], // Reh
    0x0632: [0xFEB0, 0xFEB0, 0xFEAF, 0xFEAF], // Zain
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
    0x0648: [0xFEEE, 0xFEEE, 0xFEED, 0xFEED], // Waw
    0x0649: [0xFEF0, 0xFEF0, 0xFEEF, 0xFEEF], // Alef Maksura
    0x064A: [0xFEF4, 0xFEF3, 0xFEF2, 0xFEF1]  // Yeh
};

// Check if character connects to the right
function connectsRight(ch) {
    if (!ch) return false;
    const code = ch.charCodeAt(0);
    return !!ARABIC_GLYPHS[code];
}

// Check if character connects to the left
function connectsLeft(ch) {
    if (!ch) return false;
    const code = ch.charCodeAt(0);
    const nonLeftConnectors = [0x0621, 0x0622, 0x0623, 0x0624, 0x0625, 0x0627, 0x062F, 0x0630, 0x0631, 0x0632, 0x0648, 0x0649];
    return ARABIC_GLYPHS[code] && !nonLeftConnectors.includes(code);
}

// Reshapes Arabic text to correct presentation forms
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

            const connectPrev = prev && connectsLeft(prev);
            const connectNext = next && connectsRight(next);

            let formIndex = 3; // Isolated
            if (connectPrev && connectNext) {
                formIndex = 1; // Medial
            } else if (connectPrev) {
                formIndex = 0; // Final
            } else if (connectNext) {
                formIndex = 2; // Initial
            }

            result += String.fromCharCode(forms[formIndex]);
        } else {
            result += text[i];
        }
    }
    return result;
}

// Global helper to correctly shape Arabic and reverse the word-level and letter-level ordering
function fixArabicText(text) {
    if (!text) return '';
    try {
        const str = text.toString();
        // Replace Lam-Alef ligatures first
        let prepared = str
            .replace(/لا/g, 'ﻵ')
            .replace(/لأ/g, 'ﻷ')
            .replace(/لإ/g, 'ﻹ');

        // Reshape characters
        const reshaped = reshapeArabicText(prepared);

        // Splitting into words to reverse word order & reverse letter order inside each word
        const words = reshaped.split(' ');
        const processedWords = words.map(word => {
            // If it's a number/english, keep order, else reverse characters
            if (/^[0-9a-zA-Z\-_:.\/\\+()]+$/.test(word)) {
                return word;
            }
            return word.split('').reverse().join('');
        });

        // Reverse the order of the words so sentences read Right-To-Left
        return processedWords.reverse().join(' ');
    } catch(err) {
        console.error('Shaping error:', err);
        return text;
    }
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

// Cache variables
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
    
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    if (fontRegularBase64) {
        doc.addFileToVFS('Cairo-Regular.ttf', fontRegularBase64);
        doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
    }
    if (fontBoldBase64) {
        doc.addFileToVFS('Cairo-Bold.ttf', fontBoldBase64);
        doc.addFont('Cairo-Bold.ttf', 'Cairo', 'bold');
    }

    doc.setFont('Cairo', 'normal');

    function drawHeader(pageIndex, qrCodeUrl) {
        doc.setFont('Cairo', 'bold');
        
        doc.setTextColor(0, 150, 136); // Teal
        doc.setFontSize(15);
        doc.text(fixArabicText('مؤسسة زوار طيبة'), 200, 18, { align: 'right' });
        doc.setTextColor(0, 0, 0); // Black
        doc.setFontSize(10);
        doc.setFont('Cairo', 'normal');
        doc.text(fixArabicText('للنقل البري'), 200, 23, { align: 'right' });
        doc.text(fixArabicText('ترخيص رقم - 3500005546'), 200, 28, { align: 'right' });

        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 92, 10, 24, 24);
        }
        doc.setFontSize(7);
        doc.setTextColor(0, 150, 136); // Teal
        doc.setFont('Cairo', 'bold');
        doc.text('Zowar Taiba Land Transport', 104, 37, { align: 'center' });

        if (qrCodeUrl) {
            doc.addImage(qrCodeUrl, 'PNG', 10, 10, 22, 22);
        }
    }

    function drawFooter(footerBarText) {
        doc.setFont('Cairo', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(0, 0, 0);
        
        doc.setLineDashPattern([1, 1], 0);
        doc.line(10, 275, 200, 275);
        
        doc.text(fixArabicText('📍 المدينة المنورة - الدائري الثاني طريق الملك عبدالله - خلف محطة بيحان'), 200, 279, { align: 'right' });
        doc.text('✉️ zawartaiba@gmail.com | 📞 00966 50 484 5815', 10, 279, { align: 'left' });

        doc.setFillColor(15, 76, 129); // Blue bar
        doc.rect(10, 282, 190, 8, 'F');
        doc.setTextColor(255, 255, 255); // White
        doc.text(fixArabicText(footerBarText), 200, 287, { align: 'right' });
        doc.text('Zowar Taiba Land Transport | C.R : 3500005546', 12, 287, { align: 'left' });
    }

    function drawSectionTitle(y, title) {
        doc.setFillColor(0, 150, 136); // Teal
        doc.rect(10, y, 190, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Cairo', 'bold');
        doc.setFontSize(10);
        doc.text(fixArabicText(title), 105, y + 5, { align: 'center' });
    }

    // PAGE 1
    let yPos = 43;
    drawHeader(1, data.qrUrl);
    
    doc.setFont('Cairo', 'bold');
    doc.setFontSize(13);
    doc.text(fixArabicText('كشف الركاب'), 105, yPos, { align: 'center' });
    yPos += 5;

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
            fixArabicText(`اليوم: ${data.dayString}`),
            fixArabicText(`التاريخ: ${data.dateString}`),
            fixArabicText(`رقم الحجز: ${data.bookingId}`)
        ]],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 4;
    drawSectionTitle(yPos, 'بيانات السائق');
    yPos += 9;

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
            [fixArabicText(`السائق: ${data.driverName}`), fixArabicText(`الهويه: ${data.nationalId}`), fixArabicText(`الجوال: ${data.mobile}`)],
            [fixArabicText(`السيارة: ${data.carModel}`), fixArabicText(`اللون: ${data.carColor}`), fixArabicText(`رقم اللوحه: ${data.plateNumber}`)]
        ],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 4;

    doc.autoTable({
        startY: yPos,
        theme: 'grid',
        styles: { font: 'Cairo', fontSize: 8.5, cellPadding: 2, lineColor: [220, 220, 220] },
        columnStyles: {
            0: { align: 'right', width: 95 },
            1: { align: 'right', width: 95 }
        },
        body: [
            [fixArabicText(`جهة القدوم: ${data.source}`), fixArabicText(`جهة الوصول: ${data.destination}`)]
        ],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 4;

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
            [fixArabicText(`الضيف: ${data.guestName}`), fixArabicText(`الجوال: ${data.guestPhone}`), fixArabicText(`رقم الرحله: ${data.flightNo}`)]
        ],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 4;
    drawSectionTitle(yPos, 'بيانات المرافقين');
    yPos += 9;

    const compRows = [];
    for (let i = 0; i < 6; i++) {
        const left = data.companions[i] || { name: '', id: '', nationality: '' };
        const right = data.companions[i + 6] || { name: '', id: '', nationality: '' };
        compRows.push([
            String(i + 1), fixArabicText(left.name), fixArabicText(left.id), fixArabicText(left.nationality),
            String(i + 7), fixArabicText(right.name), fixArabicText(right.id), fixArabicText(right.nationality)
        ]);
    }

    doc.autoTable({
        startY: yPos,
        theme: 'grid',
        styles: { font: 'Cairo', fontSize: 7.5, cellPadding: 1.5, lineColor: [200, 200, 200] },
        headStyles: { fillColor: [0, 150, 136], textColor: [255, 255, 255], fontStyle: 'bold', align: 'center' },
        head: [[
            fixArabicText('#'), fixArabicText('الاسم'), fixArabicText('رقم الهوية'), fixArabicText('الجنسية'),
            fixArabicText('#'), fixArabicText('الاسم'), fixArabicText('رقم الهوية'), fixArabicText('الجنسية')
        ]],
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
    doc.setTextColor(0, 0, 0);
    doc.setFont('Cairo', 'bold');
    doc.setFontSize(8.5);
    doc.text(fixArabicText('ملاحظة هامة'), 105, yPos, { align: 'center' });
    yPos += 4;
    doc.setFont('Cairo', 'normal');
    doc.setFontSize(8);
    doc.text(fixArabicText('في حالة عدم تطابق بيانات الضيف مع الاثبات تكن عرضه للجزاء وهذا تعهد منا بذلك'), 105, yPos, { align: 'center' });
    doc.text(fixArabicText('شاكرين لكم حسن تعاونكم معنا'), 105, yPos + 4, { align: 'center' });

    if (stampBase64) {
        doc.addImage(stampBase64, 'PNG', 10, yPos - 6, 26, 26);
    }

    drawFooter('امر تشغيل شامل كشف الركاب تم إصداره إلكترونيا من السيستم');

    // PAGE 2
    doc.addPage();
    drawHeader(2, data.qrUrl);
    yPos = 43;

    doc.setFont('Cairo', 'bold');
    doc.setFontSize(13);
    doc.text(fixArabicText('عقد نقل على الطرق البرية'), 105, yPos, { align: 'center' });
    yPos += 5;

    doc.autoTable({
        startY: yPos,
        theme: 'plain',
        styles: { font: 'Cairo', fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 0: { align: 'right', fillColor: [245, 245, 245] } },
        body: [[fixArabicText(`التاريخ: ${data.dateString}`)]],
        margin: { left: 130, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 8;
    doc.setFont('Cairo', 'normal');
    doc.setFontSize(9.5);
    const splitText1 = doc.splitTextToSize('تم ابرام هذا العقد بين المتعاقدين بناء على المادة (39) التاسعة والثلاثون من اللائحة المنظمة لنشاط النقل المتخصص وتأجير وتوجيه الحافلات وبناء على الفقرة (1) من المادة (39) والتي تنص على أن يجب على الناقل ابرام عقد نقل مع الأطراف المحددين في المادة (40) قبل تنفيذ عمليات النقل على الطرق البرية وبما لا يخالف أحكام هذه اللائحة ووفقاً للآلية التي تحددها هيئة النقل وبناء على ما سبق تم ابرام عقد النقل بين الأطراف الآتية:', 180);
    doc.text(splitText1.map(line => fixArabicText(line)), 200, yPos, { align: 'right', lineHeightFactor: 1.6 });
    yPos += 34;

    doc.setFont('Cairo', 'bold');
    doc.text(fixArabicText(`الطرف الأول / مؤسسة زوار طيبة للنقل البري ترخيص رقم - 3500005546`), 200, yPos, { align: 'right' });
    doc.text(fixArabicText(`الطرف الثاني / ${data.guestName}`), 200, yPos + 6, { align: 'right' });
    yPos += 16;

    doc.setFont('Cairo', 'normal');
    doc.text(fixArabicText('اتفق الطرفان على ان ينفذ الطرف الأول عملية النقل للطرف الثاني مع مرافقيه وذويهم من الموقع المحدد مسبقاً مع الطرف الثاني وتوصيلهم الى الجهه المحدده بالعقد.'), 200, yPos, { align: 'right', maxWidth: 180 });
    yPos += 14;

    doc.autoTable({
        startY: yPos,
        theme: 'grid',
        styles: { font: 'Cairo', fontSize: 9, cellPadding: 3, lineColor: [220, 220, 220] },
        columnStyles: {
            0: { align: 'right', width: 90 },
            1: { align: 'right', width: 90 }
        },
        body: [
            [fixArabicText(`النقل من: ${data.source}`), fixArabicText(`وصولاً الى: ${data.destination}`)]
        ],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 10;
    const splitText2 = doc.splitTextToSize('في حال الغاء التعاقد لاي سبب شخصي او اسباب اخرى تتعلق في الحجوزات او الانظمة تكون سياسة الالغاء والاستبدال حسب نظام وزارة التجارة السعودي.', 180);
    const splitText3 = doc.splitTextToSize('في حال الحجز وتم الالغاء قبل موعد الرحلة باكثر من 24 ساعة يتم استرداد المبلغ كامل.', 180);
    const splitText4 = doc.splitTextToSize('في حالة طلب الطرف الثاني الحجز من خلال الموقع الالكتروني للمؤسسه يعتبر الحجز وموافقته على الشروط والاحكام بالموقع الالكتروني هو موافقة على هذا العقد لتنفيذ عملية النقل المتفق عليها مع الطرف الأول بواسطة حافلات المؤسسة المرخصة والمتوافقة مع الاشتراطات المقررة من هيئة النقل.', 180);

    doc.text(splitText2.map(line => fixArabicText(line)), 200, yPos, { align: 'right', lineHeightFactor: 1.5 });
    yPos += 14;
    doc.text(splitText3.map(line => fixArabicText(line)), 200, yPos, { align: 'right', lineHeightFactor: 1.5 });
    yPos += 10;
    doc.text(splitText4.map(line => fixArabicText(line)), 200, yPos, { align: 'right', lineHeightFactor: 1.5 });

    drawFooter('امر تشغيل شامل كشف الركاب تم إصداره إلكترونيا من السيستم');

    // PAGE 3
    doc.addPage();
    drawHeader(3, data.qrUrl);
    yPos = 43;

    doc.setFont('Cairo', 'bold');
    doc.setFontSize(13);
    doc.text(fixArabicText('سجل الفحص اليومي للسيارة'), 105, yPos, { align: 'center' });
    yPos += 5;

    doc.autoTable({
        startY: yPos,
        theme: 'plain',
        styles: { font: 'Cairo', fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
            0: { align: 'right', fillColor: [245, 245, 245] },
            1: { align: 'right', fillColor: [245, 245, 245] }
        },
        body: [[fixArabicText(`التاريخ: ${data.dateString}`), fixArabicText(`رقم الحجز: ${data.bookingId}`)]],
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
        body: [[fixArabicText(`السائق: ${data.driverName}`), fixArabicText(`رقم اللوحه: ${data.plateNumber}`)]],
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 4;

    function makeInspectionAutoTable(title, items, y) {
        doc.setFont('Cairo', 'bold');
        doc.setFontSize(9);
        doc.text(fixArabicText(title), 200, y, { align: 'right' });
        
        const rows = items.map(item => [fixArabicText(item), '✓', '', '']);
        doc.autoTable({
            startY: y + 2,
            theme: 'grid',
            styles: { font: 'Cairo', fontSize: 7.5, cellPadding: 1.2, lineColor: [210, 210, 210] },
            headStyles: { fillColor: [235, 235, 235], textColor: [0, 0, 0], fontStyle: 'bold', align: 'center' },
            head: [[fixArabicText('البند'), fixArabicText('سليم'), fixArabicText('غير سليم'), fixArabicText('ملاحظات')]],
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

    yPos = makeInspectionAutoTable('ثالثاً - أدوات ومتطلبات الأمن والسلامة', [
        'طفاية حريق', 'مثلث تحذير', 'حقيبة إسعافات أولية', 'مطرقة كسر الزجاج', 'أحزمة الأمان'
    ], yPos + 4);

    yPos += 5;

    doc.autoTable({
        startY: yPos,
        theme: 'grid',
        styles: { font: 'Cairo', fontSize: 8, cellPadding: 2.5, lineColor: [0, 0, 0] },
        body: [[
            fixArabicText('إقرار') + '\n' + fixArabicText('أقر أنا السائق أعلاه بأنني قمت بفحص الحافلة والتأكد من سلامتها وجاهزيتها قبل التشغيل.')
        ]],
        columnStyles: { 0: { align: 'right', fillColor: [255, 255, 255] } },
        margin: { left: 10, right: 10 }
    });

    yPos = doc.lastAutoTable.finalY + 6;
    doc.setFont('Cairo', 'normal');
    doc.text(fixArabicText(`اسم السائق - ${data.driverName}`), 15, yPos, { align: 'left' });

    drawFooter('سجل فحص يومي للسيارة تم إصداره إلكترونيا من السيستم');

    return doc;
}
