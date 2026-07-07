// Helper: Convert an image URL to a base64 data URL
function imageToBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
    });
}

// Cache for loaded image base64 strings
let logoBase64 = null;
let stampBase64 = null;

// Preload images on page load
async function preloadImages() {
    try {
        logoBase64 = await imageToBase64('logo.png');
        stampBase64 = await imageToBase64('stamp.png');
    } catch (err) {
        console.error('Failed to preload images for PDF:', err);
    }
}

// Build the pdfmake document definition for the 3-page passenger list
function buildPdfDocument(data) {
    const TEAL = '#009688';
    const BLACK = '#000000';

    // ---- Reusable Header Builder ----
    function makeHeader(qrDataUrl) {
        return {
            columns: [
                // Right: Company Name
                {
                    width: '*',
                    stack: [
                        { text: 'مؤسسة زوار طيبة', fontSize: 16, bold: true, color: TEAL, alignment: 'right' },
                        { text: 'للنقل البري', fontSize: 10, alignment: 'right', margin: [0, 2, 0, 0] },
                        { text: 'ترخيص رقم - 3500005546', fontSize: 9, alignment: 'right', margin: [0, 2, 0, 0] }
                    ]
                },
                // Center: Logo
                {
                    width: 'auto',
                    stack: [
                        logoBase64 ? { image: logoBase64, width: 46, alignment: 'center' } : { text: '' },
                        { text: 'Zowar Taiba Land Transport', fontSize: 7, color: TEAL, bold: true, alignment: 'center', margin: [0, 2, 0, 0] }
                    ],
                    alignment: 'center',
                    margin: [15, 0, 15, 0]
                },
                // Left: QR Code
                {
                    width: 70,
                    stack: qrDataUrl ? [
                        { qr: qrDataUrl, fit: 70, alignment: 'left' }
                    ] : [{ text: '', width: 70 }],
                    alignment: 'left'
                }
            ],
            margin: [0, 0, 0, 10]
        };
    }

    // ---- Reusable Footer Builder ----
    function makeContactsBar() {
        return [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, dash: { length: 3 }, lineColor: '#ccc' }], margin: [0, 5, 0, 5] },
            {
                columns: [
                    { text: '📍 المدينة المنورة - الدائري الثاني طريق الملك عبدالله - خلف محطة بيحان', fontSize: 7, alignment: 'right' },
                    { text: '✉️ zawartaiba@gmail.com | 📞 00966 50 484 5815', fontSize: 7, alignment: 'left' }
                ],
                margin: [0, 0, 0, 5]
            }
        ];
    }

    function makeFooterBar(leftText) {
        return {
            table: {
                widths: ['*', '*'],
                body: [[
                    { text: leftText, fontSize: 7, color: '#fff', alignment: 'right', margin: [5, 3, 5, 3] },
                    { text: 'Zowar Taiba Land Transport | C.R : 3500005546', fontSize: 7, color: '#fff', alignment: 'left', margin: [5, 3, 5, 3] }
                ]]
            },
            layout: {
                fillColor: () => '#0f4c81',
                hLineWidth: () => 0,
                vLineWidth: () => 0,
                paddingLeft: () => 5,
                paddingRight: () => 5,
                paddingTop: () => 3,
                paddingBottom: () => 3
            },
            margin: [0, 5, 0, 0]
        };
    }

    // ---- Field Box Builder ----
    function makeFieldRow(fields, colCount) {
        const widths = colCount === 3 ? ['*', '*', '*'] : ['*', '*'];
        const body = [fields.map(f => {
            if (!f) return { text: '', border: [false, false, false, false] };
            return {
                stack: [
                    { text: f.label, fontSize: 8, color: '#555', bold: true, margin: [0, 0, 0, 2] },
                    { text: f.value || '', fontSize: 10, color: BLACK }
                ],
                fillColor: '#f5f5f5',
                margin: [4, 4, 4, 4]
            };
        })];

        return {
            table: { widths, body },
            layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#ddd',
                vLineColor: () => '#ddd',
                paddingLeft: () => 4,
                paddingRight: () => 4,
                paddingTop: () => 4,
                paddingBottom: () => 4
            },
            margin: [0, 3, 0, 3]
        };
    }

    // ---- Section Title Builder ----
    function makeSectionTitle(title) {
        return {
            table: {
                widths: ['*'],
                body: [[{ text: title, fontSize: 11, bold: true, color: '#fff', alignment: 'center', margin: [0, 3, 0, 3] }]]
            },
            layout: {
                fillColor: () => TEAL,
                hLineWidth: () => 0,
                vLineWidth: () => 0
            },
            margin: [0, 5, 0, 5]
        };
    }

    // ---- Doc Title Builder ----
    function makeDocTitle(title) {
        return {
            text: title,
            fontSize: 14,
            bold: true,
            alignment: 'center',
            decoration: 'underline',
            margin: [0, 5, 0, 10]
        };
    }

    // ---- Inspection Table Builder ----
    function makeInspectionTable(sectionTitle, items) {
        const headerRow = [
            { text: 'البند', bold: true, fontSize: 9, alignment: 'center', fillColor: '#e0e0e0' },
            { text: 'سليم', bold: true, fontSize: 9, alignment: 'center', fillColor: '#e0e0e0' },
            { text: 'غير سليم', bold: true, fontSize: 9, alignment: 'center', fillColor: '#e0e0e0' },
            { text: 'ملاحظات', bold: true, fontSize: 9, alignment: 'center', fillColor: '#e0e0e0' }
        ];
        const dataRows = items.map(item => [
            { text: item, fontSize: 9, alignment: 'right' },
            { text: '✓', fontSize: 10, alignment: 'center', color: TEAL, bold: true },
            { text: '', fontSize: 9 },
            { text: '', fontSize: 9 }
        ]);

        return [
            { text: sectionTitle, fontSize: 11, bold: true, margin: [0, 8, 0, 4] },
            {
                table: {
                    headerRows: 1,
                    widths: ['50%', '15%', '15%', '20%'],
                    body: [headerRow, ...dataRows]
                },
                layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => '#ccc',
                    vLineColor: () => '#ccc',
                    paddingLeft: () => 4,
                    paddingRight: () => 4,
                    paddingTop: () => 3,
                    paddingBottom: () => 3
                }
            }
        ];
    }

    // =====================
    // BUILD COMPANIONS TABLE
    // =====================
    const compHeaderRow = [
        { text: '#', bold: true, fontSize: 8, alignment: 'center', fillColor: TEAL, color: '#fff' },
        { text: 'الاسم', bold: true, fontSize: 8, alignment: 'center', fillColor: TEAL, color: '#fff' },
        { text: 'رقم الهوية', bold: true, fontSize: 8, alignment: 'center', fillColor: TEAL, color: '#fff' },
        { text: 'الجنسية', bold: true, fontSize: 8, alignment: 'center', fillColor: TEAL, color: '#fff' },
        { text: '#', bold: true, fontSize: 8, alignment: 'center', fillColor: TEAL, color: '#fff' },
        { text: 'الاسم', bold: true, fontSize: 8, alignment: 'center', fillColor: TEAL, color: '#fff' },
        { text: 'رقم الهوية', bold: true, fontSize: 8, alignment: 'center', fillColor: TEAL, color: '#fff' },
        { text: 'الجنسية', bold: true, fontSize: 8, alignment: 'center', fillColor: TEAL, color: '#fff' }
    ];

    const compDataRows = [];
    for (let i = 0; i < 6; i++) {
        const left = data.companions[i] || { name: '', id: '', nationality: '' };
        const right = data.companions[i + 6] || { name: '', id: '', nationality: '' };
        compDataRows.push([
            { text: String(i + 1), fontSize: 8, alignment: 'center' },
            { text: left.name, fontSize: 8, alignment: 'right' },
            { text: left.id, fontSize: 8, alignment: 'center' },
            { text: left.nationality, fontSize: 8, alignment: 'center' },
            { text: String(i + 7), fontSize: 8, alignment: 'center' },
            { text: right.name, fontSize: 8, alignment: 'right' },
            { text: right.id, fontSize: 8, alignment: 'center' },
            { text: right.nationality, fontSize: 8, alignment: 'center' }
        ]);
    }

    // =====================
    // PAGE 1: كشف الركاب
    // =====================
    const page1 = [
        makeHeader(data.qrUrl),
        makeDocTitle('كشف الركاب'),

        // Trip metadata
        makeFieldRow([
            { label: 'اليوم', value: data.dayString },
            { label: 'التاريخ', value: data.dateString },
            { label: 'رقم الحجز', value: String(data.bookingId) }
        ], 3),

        // Driver section
        makeSectionTitle('بيانات السائق'),
        makeFieldRow([
            { label: 'السائق', value: data.driverName },
            { label: 'الهويه', value: data.nationalId },
            { label: 'الجوال', value: data.mobile }
        ], 3),
        makeFieldRow([
            { label: 'السيارة', value: data.carModel },
            { label: 'اللون', value: data.carColor },
            { label: 'رقم اللوحه', value: data.plateNumber }
        ], 3),

        // Route section
        makeFieldRow([
            { label: 'جهة القدوم', value: data.source },
            { label: 'جهة الوصول', value: data.destination }
        ], 2),

        // Guest section
        makeFieldRow([
            { label: 'الضيف', value: data.guestName },
            { label: 'الجوال', value: data.guestPhone },
            { label: 'رقم الرحله', value: data.flightNo }
        ], 3),

        // Companions
        makeSectionTitle('بيانات المرافقين'),
        {
            table: {
                headerRows: 1,
                widths: ['3%', '23%', '14%', '10%', '3%', '23%', '14%', '10%'],
                body: [compHeaderRow, ...compDataRows]
            },
            layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#ccc',
                vLineColor: () => '#ccc',
                paddingLeft: () => 2,
                paddingRight: () => 2,
                paddingTop: () => 3,
                paddingBottom: () => 3
            },
            margin: [0, 0, 0, 10]
        },

        // Important Notice + Stamp
        {
            columns: [
                {
                    width: '*',
                    stack: [
                        { text: '**ملاحظة هامة**', fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 4] },
                        { text: 'في حالة عدم تطابق بيانات الضيف مع الاثبات تكن عرضه للجزاء وهذا تعهد منا بذلك', fontSize: 9, alignment: 'center' },
                        { text: 'شاكرين لكم حسن تعاونكم معنا', fontSize: 9, alignment: 'center', margin: [0, 4, 0, 0] }
                    ]
                },
                stampBase64 ? {
                    width: 90,
                    image: stampBase64,
                    fit: [90, 90],
                    alignment: 'left'
                } : { text: '', width: 90 }
            ],
            margin: [0, 5, 0, 0]
        },

        ...makeContactsBar(),
        makeFooterBar('امر تشغيل شامل كشف الركاب تم إصداره إلكترونيا من السيستم')
    ];

    // =====================
    // PAGE 2: عقد نقل على الطرق البرية
    // =====================
    const page2 = [
        makeHeader(data.qrUrl),
        makeDocTitle('عقد نقل على الطرق البرية'),

        // Date (right-aligned)
        makeFieldRow([
            null,
            null,
            { label: 'التاريخ', value: data.dateString }
        ], 3),

        // Legal intro text
        { text: 'تم ابرام هذا العقد بين المتعاقدين بناء على المادة (39) التاسعة والثلاثون من اللائحة المنظمة لنشاط النقل المتخصص وتأجير وتوجيه الحافلات وبناء على الفقرة (1) من المادة (39) والتي تنص على أن يجب على الناقل ابرام عقد نقل مع الأطراف المحددين في المادة (40) قبل تنفيذ عمليات النقل على الطرق البرية وبما لا يخالف أحكام هذه اللائحة ووفقاً للآلية التي تحددها هيئة النقل وبناء على ما سبق تم ابرام عقد النقل بين الأطراف الآتية:', fontSize: 10, alignment: 'right', lineHeight: 1.6, margin: [0, 10, 0, 10] },

        // Parties
        { text: 'الطرف الأول / مؤسسة زوار طيبة للنقل البري ترخيص رقم - 3500005546', fontSize: 10, bold: true, alignment: 'right', margin: [0, 0, 0, 8] },
        { text: 'الطرف الثاني / ' + data.guestName, fontSize: 10, bold: true, alignment: 'right', margin: [0, 0, 0, 10] },

        { text: 'اتفق الطرفان على ان ينفذ الطرف الأول عملية النقل للطرف الثاني مع مرافقيه وذويهم من الموقع المحدد مسبقاً مع الطرف الثاني وتوصيلهم الى الجهه المحدده بالعقد.', fontSize: 10, alignment: 'right', lineHeight: 1.6, margin: [0, 10, 0, 15] },

        // Route
        makeFieldRow([
            { label: 'النقل من', value: data.source },
            { label: 'وصولاً الى', value: data.destination }
        ], 2),

        // Cancellation terms
        { text: 'في حال الغاء التعاقد لاي سبب شخصي او اسباب اخرى تتعلق في الحجوزات او الانظمة تكون سياسة الالغاء والاستبدال حسب نظام وزارة التجارة السعودي.', fontSize: 10, alignment: 'right', lineHeight: 1.6, margin: [0, 20, 0, 8] },
        { text: 'في حال الحجز وتم الالغاء قبل موعد الرحلة باكثر من 24 ساعة يتم استرداد المبلغ كامل.', fontSize: 10, alignment: 'right', lineHeight: 1.6, margin: [0, 0, 0, 8] },
        { text: 'في حالة طلب الطرف الثاني الحجز من خلال الموقع الالكتروني للمؤسسه يعتبر الحجز وموافقته على الشروط والاحكام بالموقع الالكتروني هو موافقة على هذا العقد لتنفيذ عملية النقل المتفق عليها مع الطرف الأول بواسطة حافلات المؤسسة المرخصة والمتوافقة مع الاشتراطات المقررة من هيئة النقل.', fontSize: 10, alignment: 'right', lineHeight: 1.6, margin: [0, 0, 0, 10] },

        ...makeContactsBar(),
        makeFooterBar('امر تشغيل شامل كشف الركاب تم إصداره إلكترونيا من السيستم')
    ];

    // =====================
    // PAGE 3: سجل الفحص اليومي للسيارة
    // =====================
    const page3 = [
        makeHeader(data.qrUrl),
        makeDocTitle('سجل الفحص اليومي للسيارة'),

        // Metadata
        makeFieldRow([
            { label: 'التاريخ', value: data.dateString },
            { label: 'رقم الحجز', value: String(data.bookingId) },
            null
        ], 3),
        makeFieldRow([
            { label: 'السائق', value: data.driverName },
            { label: 'رقم اللوحه', value: data.plateNumber }
        ], 2),

        // Inspection tables
        ...makeInspectionTable('أولاً - فحص مؤشرات لوحة القيادة', [
            'مؤشر الوقود', 'مؤشر الحرارة', 'مؤشر ضغط الزيت', 'لمبة فحص المحرك', 'ABS', 'لمبات التحذير'
        ]),
        ...makeInspectionTable('ثانياً - الفحص الخارجي', [
            'الإطارات وضغط الهواء', 'الأنوار الأمامية والخلفية', 'الإشارات التحذيرية', 'الزجاج والمرايا', 'عدم وجود تسريبات'
        ]),
        ...makeInspectionTable('ثالثاً - أدوات ومتطلبات الأمن والسلامة', [
            'طفاية حريق', 'مثلث تحذير', 'حقيبة إسعافات أولية', 'مطرقة كسر الزجاج', 'أحزمة الأمان'
        ]),

        // Declaration
        {
            table: {
                widths: ['*'],
                body: [[{
                    stack: [
                        { text: 'إقرار', bold: true, fontSize: 11, margin: [0, 0, 0, 4] },
                        { text: 'أقر أنا السائق أعلاه بأنني قمت بفحص الحافلة والتأكد من سلامتها وجاهزيتها قبل التشغيل.', fontSize: 9 }
                    ],
                    alignment: 'right',
                    margin: [8, 8, 8, 8]
                }]]
            },
            layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#999',
                vLineColor: () => '#999'
            },
            margin: [0, 10, 0, 10]
        },

        // Driver signature
        { text: 'اسم السائق - ' + data.driverName, fontSize: 10, alignment: 'left', margin: [20, 0, 0, 20] },

        ...makeContactsBar(),
        makeFooterBar('سجل فحص يومي للسيارة تم إصداره إلكترونيا من السيستم')
    ];

    // =====================
    // FINAL DOCUMENT DEFINITION
    // =====================
    return {
        rtl: true,
        pageSize: 'A4',
        pageMargins: [25, 20, 25, 20],
        content: [
            ...page1,
            { text: '', pageBreak: 'after' },
            ...page2,
            { text: '', pageBreak: 'after' },
            ...page3
        ],
        defaultStyle: {
            font: 'Cairo',
            fontSize: 10,
            color: BLACK
        },
        styles: {}
    };
}
