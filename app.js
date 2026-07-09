document.addEventListener('DOMContentLoaded', () => {
    // State variables
    let drivers = [];
    let cars = [];
    let currentDriver = null;
    let currentCar = null;
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
            // Strip spaces, keep only Arabic letters (\u0621-\u064A) or English letters, limit 3
            const raw = el.value
                .replace(/\s/g, '')
                .replace(/[^a-zA-Z\u0621-\u064A]/g, '')
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
    applyPlateLettersFormat('crud-car-plate-letters');
    applyPlateNumbersFormat('crud-car-plate-numbers');

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
    applyNationalIdValidation('crud-driver-id');

    // DOM Elements - Driver CRUD
    const formCrudDriver = document.getElementById('form-crud-driver');
    const crudDriverIndex = document.getElementById('crud-driver-index');
    const crudDriverId = document.getElementById('crud-driver-id');
    const crudDriverName = document.getElementById('crud-driver-name');
    const crudDriverMobile = document.getElementById('crud-driver-mobile');
    const driversTableBody = document.getElementById('drivers-table-body');
    const driverFormTitle = document.getElementById('driver-form-title');
    const btnCancelDriver = document.getElementById('btn-cancel-driver');

    // DOM Elements - Car CRUD
    const formCrudCar = document.getElementById('form-crud-car');
    const crudCarIndex = document.getElementById('crud-car-index');
    const crudCarPlateLetters = document.getElementById('crud-car-plate-letters');
    const crudCarPlateNumbers = document.getElementById('crud-car-plate-numbers');
    const crudCarModel = document.getElementById('crud-car-model');
    const crudCarColor = document.getElementById('crud-car-color');
    const carsTableBody = document.getElementById('cars-table-body');
    const carFormTitle = document.getElementById('car-form-title');
    const btnCancelCar = document.getElementById('btn-cancel-car');

    const btnDownloadDriversJson = document.getElementById('btn-download-drivers-json');
    const btnDownloadCarsJson = document.getElementById('btn-download-cars-json');

    // ==========================================
    // DATA INITIALIZATION & CRUD
    // ==========================================

    async function initData() {
        // Check for old combined format and migrate
        const oldData = localStorage.getItem('bst_drivers');
        if (oldData) {
            const parsed = JSON.parse(oldData);
            if (parsed.length > 0 && parsed[0].carModel !== undefined) {
                // Old combined format detected — migrate
                const migratedDrivers = parsed.map(d => ({
                    nationalId: d.nationalId,
                    driverName: d.driverName,
                    mobile: d.mobile
                }));
                const migratedCars = parsed.map(d => ({
                    plateNumber: d.plateNumber,
                    carModel: d.carModel,
                    carColor: d.carColor
                }));
                // Deduplicate cars by plateNumber
                const uniqueCars = [];
                const seenPlates = new Set();
                migratedCars.forEach(c => {
                    const key = c.plateNumber.replace(/\s+/g, '');
                    if (!seenPlates.has(key)) {
                        seenPlates.add(key);
                        uniqueCars.push(c);
                    }
                });
                drivers = migratedDrivers;
                cars = uniqueCars;
                localStorage.setItem('bst_drivers_v2', JSON.stringify(drivers));
                localStorage.setItem('bst_cars', JSON.stringify(cars));
                localStorage.removeItem('bst_drivers');
                renderDriversTable();
                renderCarsTable();
                return;
            }
        }

        // Load drivers (fetch with cache-buster and merge with localStorage)
        let fileDrivers = [];
        try {
            const response = await fetch('drivers.json?v=' + Date.now());
            fileDrivers = await response.json();
        } catch (err) {
            console.error("Could not load drivers.json", err);
        }

        const storedDrivers = localStorage.getItem('bst_drivers_v2');
        if (storedDrivers) {
            drivers = JSON.parse(storedDrivers);
            // Merge any new drivers from drivers.json
            fileDrivers.forEach(fd => {
                if (!drivers.some(d => d.nationalId === fd.nationalId)) {
                    drivers.push(fd);
                }
            });
            localStorage.setItem('bst_drivers_v2', JSON.stringify(drivers));
        } else {
            drivers = fileDrivers;
            localStorage.setItem('bst_drivers_v2', JSON.stringify(drivers));
        }

        // Load cars (fetch with cache-buster and merge with localStorage)
        let fileCars = [];
        try {
            const response = await fetch('cars.json?v=' + Date.now());
            fileCars = await response.json();
        } catch (err) {
            console.error("Could not load cars.json", err);
        }

        const storedCars = localStorage.getItem('bst_cars');
        if (storedCars) {
            cars = JSON.parse(storedCars);
            // Merge any new cars from cars.json (compare plates without spaces)
            fileCars.forEach(fc => {
                const keyFc = fc.plateNumber.replace(/\s+/g, '');
                if (!cars.some(c => c.plateNumber.replace(/\s+/g, '') === keyFc)) {
                    cars.push(fc);
                }
            });
            localStorage.setItem('bst_cars', JSON.stringify(cars));
        } else {
            cars = fileCars;
            localStorage.setItem('bst_cars', JSON.stringify(cars));
        }

        renderDriversTable();
        renderCarsTable();
    }

    initData();

    // ---- DRIVERS TABLE ----
    function renderDriversTable() {
        driversTableBody.innerHTML = '';
        drivers.forEach((driver, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${driver.driverName}</td>
                <td>${driver.nationalId}</td>
                <td>${driver.mobile}</td>
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-edit-driver" data-index="${idx}" style="padding: 4px 8px; font-size: 0.8rem;">تعديل</button>
                    <button class="btn btn-danger btn-delete-driver" data-index="${idx}" style="padding: 4px 8px; font-size: 0.8rem;">حذف</button>
                </td>
            `;
            driversTableBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit-driver').forEach(btn => {
            btn.addEventListener('click', (e) => editDriver(e.target.getAttribute('data-index')));
        });
        document.querySelectorAll('.btn-delete-driver').forEach(btn => {
            btn.addEventListener('click', (e) => deleteDriver(e.target.getAttribute('data-index')));
        });
    }

    formCrudDriver.addEventListener('submit', (e) => {
        e.preventDefault();
        const index = crudDriverIndex.value;
        const driverData = {
            nationalId: crudDriverId.value.trim(),
            driverName: crudDriverName.value.trim(),
            mobile: crudDriverMobile.value.trim()
        };

        if (index === '') {
            drivers.push(driverData);
        } else {
            drivers[parseInt(index)] = driverData;
        }

        localStorage.setItem('bst_drivers_v2', JSON.stringify(drivers));
        renderDriversTable();
        resetDriverForm();
    });

    function editDriver(idx) {
        const d = drivers[idx];
        crudDriverIndex.value = idx;
        crudDriverId.value = d.nationalId;
        crudDriverName.value = d.driverName;
        crudDriverMobile.value = d.mobile;
        driverFormTitle.textContent = "تعديل بيانات السائق";
    }

    function deleteDriver(idx) {
        if (confirm("هل أنت متأكد من حذف هذا السائق؟")) {
            drivers.splice(idx, 1);
            localStorage.setItem('bst_drivers_v2', JSON.stringify(drivers));
            renderDriversTable();
            resetDriverForm();
        }
    }

    function resetDriverForm() {
        formCrudDriver.reset();
        crudDriverIndex.value = '';
        driverFormTitle.textContent = "إضافة سائق جديد";
    }

    btnCancelDriver.addEventListener('click', resetDriverForm);

    // ---- CARS TABLE ----
    function renderCarsTable() {
        carsTableBody.innerHTML = '';
        cars.forEach((car, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${car.plateNumber}</td>
                <td>${car.carModel}</td>
                <td>${car.carColor}</td>
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-edit-car" data-index="${idx}" style="padding: 4px 8px; font-size: 0.8rem;">تعديل</button>
                    <button class="btn btn-danger btn-delete-car" data-index="${idx}" style="padding: 4px 8px; font-size: 0.8rem;">حذف</button>
                </td>
            `;
            carsTableBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit-car').forEach(btn => {
            btn.addEventListener('click', (e) => editCar(e.target.getAttribute('data-index')));
        });
        document.querySelectorAll('.btn-delete-car').forEach(btn => {
            btn.addEventListener('click', (e) => deleteCar(e.target.getAttribute('data-index')));
        });
    }

    formCrudCar.addEventListener('submit', (e) => {
        e.preventDefault();
        const index = crudCarIndex.value;
        const carData = {
            plateNumber: (crudCarPlateLetters.value.trim() + ' ' + crudCarPlateNumbers.value.trim()).trim(),
            carModel: crudCarModel.value.trim(),
            carColor: crudCarColor.value.trim()
        };

        if (index === '') {
            cars.push(carData);
        } else {
            cars[parseInt(index)] = carData;
        }

        localStorage.setItem('bst_cars', JSON.stringify(cars));
        renderCarsTable();
        resetCarForm();
    });

    function editCar(idx) {
        const c = cars[idx];
        crudCarIndex.value = idx;
        const plateNums = c.plateNumber ? (c.plateNumber.match(/[0-9\u0660-\u0669]+/) || [''])[0] : '';
        const plateLets = c.plateNumber ? c.plateNumber.replace(plateNums, '').replace(/^\s+|\s+$/g, '') : '';
        crudCarPlateLetters.value = plateLets;
        crudCarPlateNumbers.value = plateNums;
        crudCarModel.value = c.carModel;
        crudCarColor.value = c.carColor;
        carFormTitle.textContent = "تعديل بيانات السيارة";
    }

    function deleteCar(idx) {
        if (confirm("هل أنت متأكد من حذف هذه السيارة؟")) {
            cars.splice(idx, 1);
            localStorage.setItem('bst_cars', JSON.stringify(cars));
            renderCarsTable();
            resetCarForm();
        }
    }

    function resetCarForm() {
        formCrudCar.reset();
        crudCarIndex.value = '';
        carFormTitle.textContent = "إضافة سيارة جديدة";
    }

    btnCancelCar.addEventListener('click', resetCarForm);

    // ---- DOWNLOAD JSON ----
    function downloadJson(data, filename) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", filename);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    btnDownloadDriversJson.addEventListener('click', () => downloadJson(drivers, 'drivers.json'));
    btnDownloadCarsJson.addEventListener('click', () => downloadJson(cars, 'cars.json'));

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

        if (username === "tolba" && password === "ZT-Tlb#9482_K!n") {
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

        // 1. Find driver by national ID
        const driver = drivers.find(d => d.nationalId === nationalId);

        // 2. Find car matching plate number
        const car = cars.find(c => 
            c.plateNumber.replace(/\s+/g, '') === plateNumber.replace(/\s+/g, '')
        );

        if (driver && car) {
            currentDriver = driver;
            currentCar = car;
            loginError.style.display = 'none';
            // Show badge info
            badgeName.textContent = driver.driverName;
            badgeCar.textContent = `${car.carModel} (${car.carColor})`;
            badgePlate.textContent = car.plateNumber;
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
        currentCar = null;
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
            carModel: currentCar.carModel,
            carColor: currentCar.carColor,
            plateNumber: currentCar.plateNumber,
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
            const fallbackQrData = `مؤسسة زوار طيبة للنقل البري\nكشف ركاب رقم الحجز: ${bookingId}\nالسائق: ${currentDriver.driverName}\nالهوية: ${currentDriver.nationalId}\nرقم اللوحة: ${currentCar.plateNumber}`;
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
