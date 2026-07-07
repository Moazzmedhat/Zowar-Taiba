document.addEventListener('DOMContentLoaded', () => {
    // State variables
    let drivers = [];
    let currentDriver = null;
    let companions = [];
    const MAX_COMPANIONS = 12;

    // DOM Elements - Sections
    const secLogin = document.getElementById('sec-login');
    const secAdminLogin = document.getElementById('sec-admin-login');
    const secTripForm = document.getElementById('sec-trip-form');
    const secAdmin = document.getElementById('sec-admin');

    const formAdminLogin = document.getElementById('form-admin-login');
    const inputAdminUser = document.getElementById('admin-user');
    const inputAdminPass = document.getElementById('admin-pass');
    const adminLoginError = document.getElementById('admin-login-error');

    // DOM Elements - Headers / Nav Buttons
    const btnShowLogin = document.getElementById('btn-show-login');
    const btnShowAdmin = document.getElementById('btn-show-admin');

    // DOM Elements - Forms
    const formLogin = document.getElementById('form-login');
    const formTrip = document.getElementById('form-trip');
    const formCrud = document.getElementById('form-crud');

    // DOM Elements - Inputs
    const inputLoginId = document.getElementById('login-id');
    const inputLoginPlate = document.getElementById('login-plate');
    const loginError = document.getElementById('login-error');

    // DOM Elements - Badge info
    const badgeName = document.getElementById('badge-name');
    const badgeCar = document.getElementById('badge-car');
    const badgePlate = document.getElementById('badge-plate');

    // DOM Elements - Trip fields
    const tripSource = document.getElementById('trip-source');
    const tripDestination = document.getElementById('trip-destination');
    const guestNameInput = document.getElementById('guest-name');
    const guestPhoneInput = document.getElementById('guest-phone');
    const companionsContainer = document.getElementById('companions-container');
    const btnAddCompanion = document.getElementById('btn-add-companion');
    const btnLogout = document.getElementById('btn-logout');

    // DOM Elements - CRUD Admin inputs
    const crudIndex = document.getElementById('crud-index');
    const crudId = document.getElementById('crud-id');
    const crudPlate = document.getElementById('crud-plate');
    const crudName = document.getElementById('crud-name');
    const crudMobile = document.getElementById('crud-mobile');
    const crudModel = document.getElementById('crud-model');
    const crudColor = document.getElementById('crud-color');
    const adminTableBody = document.getElementById('admin-table-body');
    const adminFormTitle = document.getElementById('admin-form-title');
    const btnCancelCrud = document.getElementById('btn-cancel-crud');
    const btnDownloadJson = document.getElementById('btn-download-json');

    // PDF Elements for replacement
    const pdfTemplate = document.getElementById('pdf-template-wrapper');

    // ==========================================
    // DATA INITIALIZATION & CRUD
    // ==========================================

    async function initData() {
        const storedDrivers = localStorage.getItem('bst_drivers');
        if (storedDrivers) {
            drivers = JSON.parse(storedDrivers);
            renderAdminTable();
        } else {
            try {
                const response = await fetch('drivers.json');
                drivers = await response.json();
                localStorage.setItem('bst_drivers', JSON.stringify(drivers));
                renderAdminTable();
            } catch (err) {
                console.error("Could not load default drivers.json", err);
                drivers = [];
            }
        }
    }

    initData();

    function renderAdminTable() {
        adminTableBody.innerHTML = '';
        drivers.forEach((driver, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${driver.driverName}</td>
                <td>${driver.nationalId}</td>
                <td>${driver.mobile}</td>
                <td>${driver.carModel}</td>
                <td>${driver.plateNumber}</td>
                <td>${driver.carColor}</td>
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-edit" data-index="${idx}" style="padding: 4px 8px; font-size: 0.8rem;">تعديل</button>
                    <button class="btn btn-danger btn-delete" data-index="${idx}" style="padding: 4px 8px; font-size: 0.8rem;">حذف</button>
                </td>
            `;
            adminTableBody.appendChild(tr);
        });

        // Add event listeners to CRUD actions
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                editDriver(idx);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                deleteDriver(idx);
            });
        });
    }

    // Save or update Driver CRUD
    formCrud.addEventListener('submit', (e) => {
        e.preventDefault();
        const index = crudIndex.value;
        const driverData = {
            nationalId: crudId.value.trim(),
            plateNumber: crudPlate.value.trim(),
            driverName: crudName.value.trim(),
            mobile: crudMobile.value.trim(),
            carModel: crudModel.value.trim(),
            carColor: crudColor.value.trim()
        };

        if (index === '') {
            // Create
            drivers.push(driverData);
        } else {
            // Update
            drivers[parseInt(index)] = driverData;
        }

        localStorage.setItem('bst_drivers', JSON.stringify(drivers));
        renderAdminTable();
        resetCrudForm();
    });

    function editDriver(idx) {
        const d = drivers[idx];
        crudIndex.value = idx;
        crudId.value = d.nationalId;
        crudPlate.value = d.plateNumber;
        crudName.value = d.driverName;
        crudMobile.value = d.mobile;
        crudModel.value = d.carModel;
        crudColor.value = d.carColor;
        adminFormTitle.textContent = "تعديل بيانات السائق والسيارة";
    }

    function deleteDriver(idx) {
        if (confirm("هل أنت متأكد من حذف هذا السائق؟")) {
            drivers.splice(idx, 1);
            localStorage.setItem('bst_drivers', JSON.stringify(drivers));
            renderAdminTable();
            resetCrudForm();
        }
    }

    function resetCrudForm() {
        formCrud.reset();
        crudIndex.value = '';
        adminFormTitle.textContent = "إضافة سائق وسيارة جديدة";
    }

    btnCancelCrud.addEventListener('click', resetCrudForm);

    // Download updated JSON file
    btnDownloadJson.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(drivers, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "drivers.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    // ==========================================
    // ROUTING & VIEW CONTROLS
    // ==========================================

    btnShowLogin.addEventListener('click', () => {
        secLogin.classList.remove('hidden');
        secAdminLogin.classList.add('hidden');
        secTripForm.classList.add('hidden');
        secAdmin.classList.add('hidden');
    });

    btnShowAdmin.addEventListener('click', () => {
        secAdminLogin.classList.remove('hidden');
        secLogin.classList.add('hidden');
        secTripForm.classList.add('hidden');
        secAdmin.classList.add('hidden');
        formAdminLogin.reset();
        adminLoginError.style.display = 'none';
    });

    formAdminLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = inputAdminUser.value.trim();
        const password = inputAdminPass.value.trim();

        if (username === "admin" && password === "admin") {
            adminLoginError.style.display = 'none';
            secAdmin.classList.remove('hidden');
            secAdminLogin.classList.add('hidden');
            secLogin.classList.add('hidden');
            secTripForm.classList.add('hidden');
        } else {
            adminLoginError.style.display = 'block';
        }
    });

    // ==========================================
    // LOGIN & VALIDATION LOGIC
    // ==========================================

    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const nationalId = inputLoginId.value.trim();
        const plateNumber = inputLoginPlate.value.trim();

        // Find driver matching ID and Plate
        const driver = drivers.find(d => 
            d.nationalId === nationalId && 
            d.plateNumber.replace(/\s+/g, '') === plateNumber.replace(/\s+/g, '')
        );

        if (driver) {
            currentDriver = driver;
            loginError.style.display = 'none';
            // Show badge
            badgeName.textContent = driver.driverName;
            badgeCar.textContent = `${driver.carModel} (${driver.carColor})`;
            badgePlate.textContent = driver.plateNumber;
            // Transition view
            secLogin.classList.add('hidden');
            secTripForm.classList.remove('hidden');
            // Reset companion list
            companions = [];
            renderCompanions();
        } else {
            loginError.style.display = 'block';
        }
    });

    btnLogout.addEventListener('click', () => {
        currentDriver = null;
        formLogin.reset();
        secTripForm.classList.add('hidden');
        secLogin.classList.remove('hidden');
    });

    // ==========================================
    // COMPANIONS FORM LOGIC
    // ==========================================

    function renderCompanions() {
        companionsContainer.innerHTML = '';
        companions.forEach((comp, idx) => {
            const row = document.createElement('div');
            row.className = 'companion-row';
            row.innerHTML = `
                <div class="companion-index">${idx + 1}</div>
                <div>
                    <input type="text" placeholder="الاسم" value="${comp.name}" data-idx="${idx}" class="comp-name" required>
                </div>
                <div>
                    <input type="text" placeholder="رقم الهوية" value="${comp.id}" data-idx="${idx}" class="comp-id" required>
                </div>
                <div>
                    <input type="text" placeholder="الجنسية" value="${comp.nationality}" data-idx="${idx}" class="comp-nationality" required>
                </div>
                <div>
                    <button type="button" class="btn btn-danger btn-remove-comp" data-idx="${idx}" style="padding: 6px 10px;">حذف</button>
                </div>
            `;
            companionsContainer.appendChild(row);
        });

        // Add Listeners to inputs
        document.querySelectorAll('.comp-name').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                companions[idx].name = e.target.value;
            });
        });

        document.querySelectorAll('.comp-id').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                companions[idx].id = e.target.value;
            });
        });

        document.querySelectorAll('.comp-nationality').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                companions[idx].nationality = e.target.value;
            });
        });

        document.querySelectorAll('.btn-remove-comp').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                companions.splice(idx, 1);
                renderCompanions();
            });
        });

        // Toggle add button limit
        if (companions.length >= MAX_COMPANIONS) {
            btnAddCompanion.disabled = true;
        } else {
            btnAddCompanion.disabled = false;
        }
    }

    btnAddCompanion.addEventListener('click', () => {
        if (companions.length < MAX_COMPANIONS) {
            companions.push({ name: '', id: '', nationality: '' });
            renderCompanions();
        }
    });

    // ==========================================
    // PDF GENERATION & RANDOM NUMBER LOGIC
    // ==========================================

    formTrip.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Generate random elements
        const bookingId = Math.floor(100000 + Math.random() * 900000); // 6 digit booking number
        const flightNo = "SV" + Math.floor(100 + Math.random() * 900); // SV + 3 digit flight number
        
        // 2. Fetch current date info (localized to user's timezone)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dayString = days[now.getDay()];

        const addSpacing = (str) => {
            if (!str) return '';
            // Replaces multiple spaces with double non-breaking spaces for PDF boxes
            return str.toString().trim().split(/\s+/).join('\u00A0\u00A0');
        };

        // 3. Populate Page 1 values
        document.getElementById('p1-day').textContent = addSpacing(dayString);
        document.getElementById('p1-date').textContent = addSpacing(dateString);
        document.getElementById('p1-booking-id').textContent = addSpacing(bookingId);
        document.getElementById('p1-driver-name').textContent = addSpacing(currentDriver.driverName);
        document.getElementById('p1-driver-id').textContent = addSpacing(currentDriver.nationalId);
        document.getElementById('p1-driver-phone').textContent = addSpacing(currentDriver.mobile);
        document.getElementById('p1-car-model').textContent = addSpacing(currentDriver.carModel);
        document.getElementById('p1-car-color').textContent = addSpacing(currentDriver.carColor);
        document.getElementById('p1-car-plate').textContent = addSpacing(currentDriver.plateNumber);
        document.getElementById('p1-source').textContent = addSpacing(tripSource.value);
        document.getElementById('p1-destination').textContent = addSpacing(tripDestination.value);
        
        // Handle optional Guest Name and phone
        const gName = guestNameInput.value.trim() || "غير محدد";
        const gPhone = guestPhoneInput.value.trim() || "غير محدد";
        document.getElementById('p1-guest-name').textContent = addSpacing(gName);
        document.getElementById('p1-guest-phone').textContent = addSpacing(gPhone);
        document.getElementById('p1-flight-no').textContent = addSpacing(flightNo);

        // 4. Populate Page 2 values
        document.getElementById('p2-date').textContent = addSpacing(dateString);
        document.getElementById('p2-guest-name').textContent = addSpacing(gName);
        document.getElementById('p2-source').textContent = addSpacing(tripSource.value);
        document.getElementById('p2-destination').textContent = addSpacing(tripDestination.value);

        // 5. Populate Page 3 values
        document.getElementById('p3-date').textContent = addSpacing(dateString);
        document.getElementById('p3-booking-id').textContent = addSpacing(bookingId);
        document.getElementById('p3-driver-name').textContent = addSpacing(currentDriver.driverName);
        document.getElementById('p3-car-plate').textContent = addSpacing(currentDriver.plateNumber);
        document.getElementById('p3-driver-signature').textContent = addSpacing(currentDriver.driverName);

        // 6. Build Companions side-by-side table rows
        const compTbody = document.getElementById('p1-companions-tbody');
        compTbody.innerHTML = '';
        
        // Output exactly 6 rows to fill the template layout nicely
        for (let rowIdx = 0; rowIdx < 6; rowIdx++) {
            const compLeftIdx = rowIdx;          // Indices 0, 1, 2, 3, 4, 5 (for column 1-6)
            const compRightIdx = rowIdx + 6;     // Indices 6, 7, 8, 9, 10, 11 (for column 7-12)

            const leftComp = companions[compLeftIdx] || { name: '', id: '', nationality: '' };
            const rightComp = companions[compRightIdx] || { name: '', id: '', nationality: '' };

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${compLeftIdx + 1}</td>
                <td>${leftComp.name}</td>
                <td>${leftComp.id}</td>
                <td>${leftComp.nationality}</td>
                <td>${compRightIdx + 1}</td>
                <td>${rightComp.name}</td>
                <td>${rightComp.id}</td>
                <td>${rightComp.nationality}</td>
            `;
            compTbody.appendChild(tr);
        }

        // Put empty/placeholder image for QR initially
        document.getElementById('qrcode-p1').src = '';
        document.getElementById('qrcode-p2').src = '';
        document.getElementById('qrcode-p3').src = '';

        // Show upload indicator
        const statusNotice = document.createElement('div');
        statusNotice.style.position = 'fixed';
        statusNotice.style.top = '20px';
        statusNotice.style.left = '50%';
        statusNotice.style.transform = 'translateX(-50%)';
        statusNotice.style.background = '#0f4c81';
        statusNotice.style.color = '#fff';
        statusNotice.style.padding = '12px 24px';
        statusNotice.style.borderRadius = '8px';
        statusNotice.style.zIndex = '99999';
        statusNotice.style.fontWeight = 'bold';
        statusNotice.textContent = "جاري رفع الملف وإصدار رمز الـ QR... يرجى الانتظار";
        document.body.appendChild(statusNotice);

        const opt = {
            margin:       0,
            filename:     `Zowar-Taiba-Trip-Booking-${bookingId}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['css', 'legacy'] }
        };

        // Get iframe reference and document
        const iframe = document.getElementById('pdf-render-iframe');
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        // Copy populated template and CSS to iframe
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <link rel="stylesheet" href="style.css">
                <style>
                    body { margin: 0; background: #fff; width: 794px; }
                </style>
            </head>
            <body>
                ${pdfTemplate.outerHTML}
            </body>
            </html>
        `);
        iframeDoc.close();

        // Wait slightly for iframe style load, then render
        setTimeout(() => {
            const targetElement = iframeDoc.body;

            // Render first draft PDF to upload
            html2pdf().set(opt).from(targetElement).toPdf().get('pdf').then(function(pdfObj) {
                const pdfBlob = pdfObj.output('blob');
                
                // Upload to Vercel Blob Storage via our API endpoint
                fetch(`/api/upload?filename=booking-${bookingId}.pdf`, {
                    method: 'POST',
                    body: pdfBlob
                })
                .then(response => {
                    if (!response.ok) throw new Error("Vercel Blob upload response failed");
                    return response.json();
                })
                .then(data => {
                    // Vercel Blob returns the direct permanent URL in the 'url' property
                    const publicUrl = data.url;
                    
                    // Now render the QR codes using this public URL inside the iframe elements
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`;
                    iframeDoc.getElementById('qrcode-p1').src = qrUrl;
                    iframeDoc.getElementById('qrcode-p2').src = qrUrl;
                    iframeDoc.getElementById('qrcode-p3').src = qrUrl;

                    // Also sync back to main page elements just in case
                    document.getElementById('qrcode-p1').src = qrUrl;
                    document.getElementById('qrcode-p2').src = qrUrl;
                    document.getElementById('qrcode-p3').src = qrUrl;

                    // Wait slightly for QR images to load, then re-render the final PDF
                    setTimeout(() => {
                        html2pdf().set(opt).from(targetElement).save().then(() => {
                            statusNotice.remove();
                            alert("تم إصدار كشف الركاب بنجاح! عند مسح رمز الـ QR سيفتح الملف مباشرة.");
                        }).catch(pdfErr => {
                            statusNotice.remove();
                            console.error("PDF Final Render Error:", pdfErr);
                            alert("خطأ أثناء إصدار كشف الركاب النهائي: " + pdfErr.message);
                        });
                    }, 800);
                })
                .catch(uploadErr => {
                    statusNotice.remove();
                    console.error("Cloud Upload Error:", uploadErr);
                    alert("يتعذر الاتصال بالسحابة حالياً. تم حفظ كشف الركاب محلياً برمز QR احتياطي.");
                    
                    // Fallback QR code containing metadata summary in readable plain text
                    const fallbackQrData = `مؤسسة زوار طيبة للنقل البري\nكشف ركاب رقم الحجز: ${bookingId}\nالسائق: ${currentDriver.driverName}\nالهوية: ${currentDriver.nationalId}\nرقم اللوحة: ${currentDriver.plateNumber}`;
                    const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fallbackQrData)}`;
                    
                    iframeDoc.getElementById('qrcode-p1').src = fallbackQrUrl;
                    iframeDoc.getElementById('qrcode-p2').src = fallbackQrUrl;
                    iframeDoc.getElementById('qrcode-p3').src = fallbackQrUrl;

                    document.getElementById('qrcode-p1').src = fallbackQrUrl;
                    document.getElementById('qrcode-p2').src = fallbackQrUrl;
                    document.getElementById('qrcode-p3').src = fallbackQrUrl;
                    
                    setTimeout(() => {
                        html2pdf().set(opt).from(targetElement).save();
                    }, 800);
                });
            }).catch(compileErr => {
                statusNotice.remove();
                console.error("PDF compilation error:", compileErr);
                alert("حدث خطأ أثناء إصدار كشف الركاب: " + compileErr.message);
            });
        }, 200);
    });

});
