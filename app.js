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
    const inputLoginPlateLetters = document.getElementById('login-plate-letters');
    const inputLoginPlateNumbers = document.getElementById('login-plate-numbers');
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

    // ==========================================
    // SAUDI CITIES SEARCHABLE DROPDOWN
    // ==========================================
    const SAUDI_CITIES = [
        'مكة المكرمة','المدينة المنورة','الرياض','جدة','الطائف','الدمام','الخبر','الظهران',
        'تبوك','بريدة','أبها','خميس مشيط','حائل','نجران','جازان','الجبيل','ينبع','الأحساء',
        'القطيف','عرعر','سكاكا','الباحة','بيشة','الخرج','المجمعة','القصيم','الدوادمي',
        'رابغ','الليث','القنفذة','تيماء','العُلا','وادي الدواسر','شرورة','الزلفي',
        'رفحاء','طريف','عفيف','الرس','المذنب','الدرعية','الدلم','حوطة بني تميم',
        'المخواة','بلجرشي','المندق','العقيق','قلوة','ضمد','أحد رفيدة','محايل عسير',
        'صامطة','الحرث','أبو عريش','صبيا','بيش','فرسان','ضباء','أملج','الوجه',
        'حقل','شرما','البدع','مدين','مطار الملك عبدالعزيز الدولي','مطار الملك خالد الدولي',
        'مطار الأمير محمد بن عبدالعزيز','مطار الملك فهد الدولي','مطار الملك عبدالله بن عبدالعزيز',
        'المسجد الحرام','المسجد النبوي الشريف','منى','عرفات','مزدلفة','الجعرانة'
    ];

    function initCityDropdown(searchInputId, hiddenInputId, listId) {
        const searchEl  = document.getElementById(searchInputId);
        const hiddenEl  = document.getElementById(hiddenInputId);
        const listEl    = document.getElementById(listId);
        if (!searchEl || !hiddenEl || !listEl) return;

        let activeIdx = -1;

        function highlight(text, query) {
            if (!query) return text;
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
        }

        function renderList(query) {
            const q = query.trim();
            const filtered = q
                ? SAUDI_CITIES.filter(c => c.includes(q))
                : SAUDI_CITIES;

            listEl.innerHTML = '';
            activeIdx = -1;

            if (filtered.length === 0) {
                listEl.innerHTML = '<li class="no-result">لا توجد نتائج</li>';
            } else {
                filtered.forEach((city) => {
                    const li = document.createElement('li');
                    li.innerHTML = highlight(city, q);
                    li.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        selectCity(city);
                    });
                    listEl.appendChild(li);
                });
            }
            listEl.classList.add('open');
        }

        function selectCity(city) {
            searchEl.value  = city;
            hiddenEl.value  = city;
            searchEl.classList.add('selected');
            listEl.classList.remove('open');
            activeIdx = -1;
        }

        function closeList() {
            listEl.classList.remove('open');
            activeIdx = -1;
        }

        searchEl.addEventListener('focus', () => renderList(searchEl.value));
        searchEl.addEventListener('input', () => {
            hiddenEl.value = '';
            searchEl.classList.remove('selected');
            renderList(searchEl.value);
        });

        searchEl.addEventListener('keydown', (e) => {
            const items = listEl.querySelectorAll('li:not(.no-result)');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIdx = Math.min(activeIdx + 1, items.length - 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIdx = Math.max(activeIdx - 1, 0);
            } else if (e.key === 'Enter' && activeIdx >= 0) {
                e.preventDefault();
                selectCity(items[activeIdx].textContent);
                return;
            } else if (e.key === 'Escape') {
                closeList();
                return;
            }
            items.forEach((li, i) => li.classList.toggle('active', i === activeIdx));
            if (activeIdx >= 0) items[activeIdx].scrollIntoView({ block: 'nearest' });
        });

        searchEl.addEventListener('blur', () => {
            setTimeout(closeList, 150);
            // If typed text doesn't match a selection, clear hidden
            if (!hiddenEl.value) searchEl.value = '';
        });
    }

    initCityDropdown('trip-source-search', 'trip-source', 'source-list');
    initCityDropdown('trip-dest-search',   'trip-destination', 'dest-list');

    // ==========================================
    // PLATE LETTERS AUTO-FORMATTER (spaces after each letter, max 3)
    // ==========================================
    function applyPlateLettersFormat(inputId) {
        const el = document.getElementById(inputId);
        if (!el) return;
        el.setAttribute('maxlength', '5'); // "أ ب ج" = 5 chars
        el.addEventListener('input', () => {
            const cursor = el.selectionStart;
            // Strip spaces, keep only Arabic or English letters, limit 3
            const raw = el.value
                .replace(/\s/g, '')
                .replace(/[^a-zA-Z\u0600-\u06FF]/g, '')
                .slice(0, 3);
            // Re-join with spaces between every letter
            el.value = raw.split('').join(' ');
        });
    }

    function applyPlateNumbersFormat(inputId) {
        const el = document.getElementById(inputId);
        if (!el) return;
        el.setAttribute('maxlength', '4');
        el.addEventListener('input', () => {
            el.value = el.value.replace(/[^0-9\u0660-\u0669]/g, '').slice(0, 4);
        });
    }

    applyPlateLettersFormat('login-plate-letters');
    applyPlateNumbersFormat('login-plate-numbers');
    applyPlateLettersFormat('crud-plate-letters');
    applyPlateNumbersFormat('crud-plate-numbers');

    // ==========================================
    // NATIONAL ID VALIDATION (digits only, max 10)
    // ==========================================
    function applyNationalIdValidation(inputId) {
        const el = document.getElementById(inputId);
        if (!el) return;
        el.setAttribute('maxlength', '10');
        el.addEventListener('input', () => {
            el.value = el.value.replace(/[^0-9\u0660-\u0669]/g, '').slice(0, 10);
        });
    }
    applyNationalIdValidation('login-id');
    applyNationalIdValidation('crud-id');

    // DOM Elements - CRUD Admin inputs
    const crudIndex = document.getElementById('crud-index');
    const crudId = document.getElementById('crud-id');
    const crudPlateLetters = document.getElementById('crud-plate-letters');
    const crudPlateNumbers = document.getElementById('crud-plate-numbers');
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
            plateNumber: (crudPlateLetters.value.trim() + ' ' + crudPlateNumbers.value.trim()).trim(),
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
        // Split existing plateNumber back into letters and numbers for editing
        const plateMatch = d.plateNumber ? d.plateNumber.match(/^([^0-9٠-٩]*)(\s*[0-9٠-٩]+\s*)([^0-9٠-٩]*)$/) : null;
        const plateNums = d.plateNumber ? (d.plateNumber.match(/[0-9\u0660-\u0669]+/) || [''])[0] : '';
        const plateLets = d.plateNumber ? d.plateNumber.replace(plateNums, '').replace(/^\s+|\s+$/g, '') : '';
        crudPlateLetters.value = plateLets;
        crudPlateNumbers.value = plateNums;
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
        const plateNumber = (inputLoginPlateLetters.value.trim() + ' ' + inputLoginPlateNumbers.value.trim()).trim();

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

    // Preload font and image assets for vector PDF compilation
    preloadPdfAssets();

    formTrip.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Generate random elements
        const bookingId = Math.floor(100000 + Math.random() * 900000); // 6 digit booking number
        const flightNo = "SV" + Math.floor(100 + Math.random() * 900); // SV + 3 digit flight number
        
        // 2. Fetch current date info
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dayString = days[now.getDay()];

        const gName = guestNameInput.value.trim() || "غير محدد";
        const gPhone = guestPhoneInput.value.trim() || "غير محدد";

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
        statusNotice.textContent = "جاري إصدار كشف الركاب... يرجى الانتظار";
        document.body.appendChild(statusNotice);

        const pdfData = {
            bookingId,
            flightNo,
            dateString,
            dayString,
            driverName: currentDriver.driverName,
            nationalId: currentDriver.nationalId,
            mobile: currentDriver.mobile,
            carModel: currentDriver.carModel,
            carColor: currentDriver.carColor,
            plateNumber: currentDriver.plateNumber,
            source: tripSource.value,
            destination: tripDestination.value,
            guestName: gName,
            guestPhone: gPhone,
            companions: companions,
            qrUrl: null
        };

        try {
            // Step 1: Generate draft PDF without QR to upload and get permanent URL
            const draftDoc = await generateTripPdf(pdfData);
            const pdfBlob = draftDoc.output('blob');

            // Upload to Vercel Blob
            const response = await fetch(`/api/upload?filename=booking-${bookingId}.pdf`, {
                method: 'POST',
                body: pdfBlob
            });

            if (!response.ok) {
                let errText = "";
                try {
                    errText = await response.text();
                } catch(e) {}
                throw new Error(`Vercel Blob upload failed with status ${response.status} (${response.statusText}). Response: ${errText.slice(0, 150)}`);
            }
            const data = await response.json();
            const publicUrl = data.url;

            // Step 2: Re-generate the PDF with the QR code image
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`;
            const qrCodeBase64 = await imageToBase64(qrCodeUrl);

            pdfData.qrUrl = qrCodeBase64 || publicUrl;
            const finalDoc = await generateTripPdf(pdfData);
            
            // Download to device
            finalDoc.save(`Zowar-Taiba-Trip-Booking-${bookingId}.pdf`);

            // Upload the final version with the QR code to overwrite draft
            const finalBlob = finalDoc.output('blob');
            fetch(`/api/upload?filename=booking-${bookingId}.pdf`, {
                method: 'POST',
                body: finalBlob
            }).catch(err => console.error("Final PDF sync error:", err));

            statusNotice.remove();
            alert("تم إصدار كشف الركاب بنجاح! عند مسح رمز الـ QR سيفتح الملف مباشرة.");

        } catch (err) {
            console.error("PDF generation failed:", err);
            
            // Fallback: Generate offline PDF with metadata-only QR code
            const fallbackQrData = `مؤسسة زوار طيبة للنقل البري\nكشف ركاب رقم الحجز: ${bookingId}\nالسائق: ${currentDriver.driverName}\nالهوية: ${currentDriver.nationalId}\nرقم اللوحة: ${currentDriver.plateNumber}`;
            const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fallbackQrData)}`;
            const fallbackQrBase64 = await imageToBase64(fallbackQrUrl);

            pdfData.qrUrl = fallbackQrBase64 || fallbackQrData;
            const fallbackDoc = await generateTripPdf(pdfData);
            fallbackDoc.save(`Zowar-Taiba-Trip-Booking-${bookingId}.pdf`);

            statusNotice.remove();
            alert(`يتعذر الاتصال بالسحابة حالياً. تم حفظ كشف الركاب محلياً برمز QR احتياطي.\n\nسبب الخطأ:\n${err.message}`);
        }
    });

});
