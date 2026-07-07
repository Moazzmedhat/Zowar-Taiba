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
                <td>\</td>
                <td>\</td>
                <td>\</td>
                <td>\</td>
                <td>\</td>
                <td>\</td>
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-edit" data-index="\" style="padding: 4px 8px; font-size: 0.8rem;">ØªØ¹Ø¯ÙŠÙ„</button>
                    <button class="btn btn-danger btn-delete" data-index="\" style="padding: 4px 8px; font-size: 0.8rem;">Ø­Ø°Ù</button>
                </td>
            \;
            adminTableBody.appendChild(tr);
        });

        // Add Event Listeners for action buttons dynamically
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                editDriver(idx);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                deleteDriver(idx);
            });
        });
    }

    function editDriver(index) {
        const driver = drivers[index];
        crudIndex.value = index;
        crudId.value = driver.nationalId;
        crudPlate.value = driver.plateNumber;
        crudName.value = driver.driverName;
        crudMobile.value = driver.mobile;
        crudModel.value = driver.carModel;
        crudColor.value = driver.carColor;

        adminFormTitle.textContent = "ØªØ¹Ø¯ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø³Ø§Ø¦Ù‚";
        btnCancelCrud.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function deleteDriver(index) {
        if (confirm("Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ø³Ø§Ø¦Ù‚ØŸ")) {
            drivers.splice(index, 1);
            localStorage.setItem('bst_drivers', JSON.stringify(drivers));
            renderAdminTable();
            resetCrudForm();
        }
    }

    function resetCrudForm() {
        crudIndex.value = '';
        formCrud.reset();
        adminFormTitle.textContent = "Ø¥Ø¶Ø§ÙØ© Ø³Ø§Ø¦Ù‚ Ø¬Ø¯ÙŠØ¯";
        btnCancelCrud.style.display = 'none';
    }

    btnCancelCrud.addEventListener('click', () => {
        resetCrudForm();
    });

    formCrud.addEventListener('submit', (e) => {
        e.preventDefault();

        const indexVal = crudIndex.value;
        const newDriver = {
            nationalId: crudId.value.trim(),
            plateNumber: crudPlate.value.trim(),
            driverName: crudName.value.trim(),
            mobile: crudMobile.value.trim(),
            carModel: crudModel.value.trim(),
            carColor: crudColor.value.trim()
        };

        if (indexVal === '') {
            // Add new
            drivers.push(newDriver);
        } else {
            // Edit existing
            drivers[parseInt(indexVal)] = newDriver;
        }

        localStorage.setItem('bst_drivers', JSON.stringify(drivers));
        renderAdminTable();
        resetCrudForm();
        alert("ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø¨Ù†Ø¬Ø§Ø­.");
    });

    btnDownloadJson.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(drivers, null, 4));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "drivers.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });


    // ==========================================
    // NAVIGATION & PORTALS CONTROLLER
    // ==========================================

    function showSection(sectionId) {
        secLogin.style.display = 'none';
        secAdminLogin.style.display = 'none';
        secTripForm.style.display = 'none';
        secAdmin.style.display = 'none';

        if (sectionId === 'login') secLogin.style.display = 'block';
        else if (sectionId === 'admin-login') secAdminLogin.style.display = 'block';
        else if (sectionId === 'trip') secTripForm.style.display = 'block';
        else if (sectionId === 'admin') secAdmin.style.display = 'block';
    }

    btnShowLogin.addEventListener('click', () => {
        showSection('login');
    });

    btnShowAdmin.addEventListener('click', () => {
        showSection('admin-login');
    });

    // Handle Admin Password login
    formAdminLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = inputAdminUser.value.trim();
        const password = inputAdminPass.value.trim();

        if (username === 'admin' && password === 'admin') {
            adminLoginError.style.display = 'none';
            inputAdminPass.value = '';
            showSection('admin');
        } else {
            adminLoginError.textContent = "Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø£Ùˆ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­Ø©.";
            adminLoginError.style.display = 'block';
        }
    });

    // Handle Driver login
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();

        const idNum = inputLoginId.value.trim();
        const plateNum = inputLoginPlate.value.trim().replace(/\s+/g, ''); // strip spaces for validation comparison

        // Find driver
        const matched = drivers.find(d => 
            d.nationalId === idNum && 
            d.plateNumber.replace(/\s+/g, '') === plateNum
        );

        if (matched) {
            loginError.style.display = 'none';
            currentDriver = matched;

            // Set UI values
            badgeName.textContent = currentDriver.driverName;
            badgeCar.textContent = currentDriver.carModel + " (" + currentDriver.carColor + ")";
            badgePlate.textContent = currentDriver.plateNumber;

            // Reset form input
            inputLoginId.value = '';
            inputLoginPlate.value = '';

            // Auto initialize first companion item
            companions = [{ name: '', id: '', nationality: '' }];
            renderCompanions();

            // Redirect
            showSection('trip');
        } else {
            loginError.textContent = "Ø®Ø·Ø£ ÙÙŠ Ø±Ù‚Ù… Ø§Ù„Ù‡ÙˆÙŠØ© Ø£Ùˆ Ø±Ù‚Ù… Ø§Ù„Ù„ÙˆØ­Ø©. ÙŠØ±Ø¬Ù‰ Ø§Ù„ØªØ­Ù‚Ù‚ ÙˆØ¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.";
            loginError.style.display = 'block';
        }
    });

    btnLogout.addEventListener('click', () => {
        currentDriver = null;
        companions = [];
        formTrip.reset();
        showSection('login');
    });


    // ==========================================
    // COMPANIONS DYNAMIC LIST LOGIC
    // ==========================================

    function renderCompanions() {
        companionsContainer.innerHTML = '';
        companions.forEach((comp, idx) => {
            const div = document.createElement('div');
            div.className = 'companion-rowCard';
            div.innerHTML = 
                <div class="companion-header">
                    <h4>Ù…Ø±Ø§ÙÙ‚ Ø±Ù‚Ù… \</h4>
                    <button type="button" class="btn-remove-comp" data-idx="\">Ø¥Ø²Ø§Ù„Ø©</button>
                </div>
                <div class="companion-grid">
                    <div>
                        <label>Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„</label>
                        <input type="text" class="comp-name" data-idx="\" value="\" placeholder="Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„Ù…Ø±Ø§ÙÙ‚ Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠ Ø£Ùˆ Ø§Ù„Ø«Ù„Ø§Ø«ÙŠ" required>
                    </div>
                    <div>
                        <label>Ø±Ù‚Ù… Ø§Ù„Ù‡ÙˆÙŠØ© / Ø¬ÙˆØ§Ø² Ø§Ù„Ø³ÙØ±</label>
                        <input type="text" class="comp-id" data-idx="\" value="\" placeholder="Ø£Ø¯Ø®Ù„ Ø±Ù‚Ù… Ø§Ù„Ù‡ÙˆÙŠØ© Ø£Ùˆ Ø§Ù„Ø¬ÙˆØ§Ø²" required>
                    </div>
                    <div>
                        <label>Ø§Ù„Ø¬Ù†Ø³ÙŠØ©</label>
                        <input type="text" class="comp-nationality" data-idx="\" value="\" placeholder="Ø£Ø¯Ø®Ù„ Ø§Ù„Ø¬Ù†Ø³ÙŠØ© (Ù…Ø«Ø§Ù„: Ù…ØµØ±ÙŠ)" required>
                    </div>
                </div>
            \;
            companionsContainer.appendChild(div);
        });

        // Add event listeners back to dynamic elements
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

    // Preload images for PDF on page load
    preloadImages();

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
        const dateString = ${year}--;
        
        const days = ['Ø§Ù„Ø£Ø­Ø¯', 'Ø§Ù„Ø§Ø«Ù†ÙŠÙ†', 'Ø§Ù„Ø«Ù„Ø§Ø«Ø§Ø¡', 'Ø§Ù„Ø£Ø±Ø¨Ø¹Ø§Ø¡', 'Ø§Ù„Ø®Ù…ÙŠØ³', 'Ø§Ù„Ø¬Ù…Ø¹Ø©', 'Ø§Ù„Ø³Ø¨Øª'];
        const dayString = days[now.getDay()];

        // Handle optional Guest Name and phone
        const gName = guestNameInput.value.trim() || "ØºÙŠØ± Ù…Ø­Ø¯Ø¯";
        const gPhone = guestPhoneInput.value.trim() || "ØºÙŠØ± Ù…Ø­Ø¯Ø¯";

        alert("Checkpoint A: Form submit event fired");
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
        statusNotice.textContent = "Ø¬Ø§Ø±ÙŠ Ø¥ØµØ¯Ø§Ø± ÙƒØ´Ù Ø§Ù„Ø±ÙƒØ§Ø¨... ÙŠØ±Ø¬Ù‰ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±";
        document.body.appendChild(statusNotice);

        try {
            alert("Checkpoint B: About to build draft document definition");
            // Build data object for pdfmake inside the try block
            const pdfData = {
                bookingId,
                flightNo,
                dateString,
                dayString,
                driverName: currentDriver ? currentDriver.driverName : 'ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ',
                nationalId: currentDriver ? currentDriver.nationalId : 'ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ',
                mobile: currentDriver ? currentDriver.mobile : 'ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ',
                carModel: currentDriver ? currentDriver.carModel : 'ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ',
                carColor: currentDriver ? currentDriver.carColor : 'ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ',
                plateNumber: currentDriver ? currentDriver.plateNumber : 'ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ',
                source: tripSource.value,
                destination: tripDestination.value,
                guestName: gName,
                guestPhone: gPhone,
                companions: companions,
                qrUrl: null // Will be set after upload
            };
            
            // Step 1: Generate a draft PDF (without QR) to upload to Vercel Blob
            const draftDoc = buildPdfDocument(pdfData);
            alert("Checkpoint C: Document definition built successfully, compiling to PDF");
            const draftPdf = pdfMake.createPdf(draftDoc);
            alert("Checkpoint D: PDF compile initiated, getting Blob");

            draftPdf.getBase64((base64Data) => {
                alert("Checkpoint E: getBase64 callback entered successfully!");
                // Convert base64 back to blob for upload on main thread
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

                // Upload to Vercel Blob Storage via our API endpoint
                fetch(/api/upload?filename=booking-\.pdf, {
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
                    
                    // Step 2: Re-generate the PDF with QR code pointing to the uploaded PDF
                    pdfData.qrUrl = publicUrl;
                    const finalDoc = buildPdfDocument(pdfData);
                    const finalPdf = pdfMake.createPdf(finalDoc);

                    // Download the final PDF with QR code
                    finalPdf.download(Zowar-Taiba-Trip-Booking-\.pdf, () => {
                        statusNotice.remove();
                        alert("ØªÙ… Ø¥ØµØ¯Ø§Ø± ÙƒØ´Ù Ø§Ù„Ø±ÙƒØ§Ø¨ Ø¨Ù†Ø¬Ø§Ø­! Ø¹Ù†Ø¯ Ù…Ø³Ø­ Ø±Ù…Ø² Ø§Ù„Ù€ QR Ø³ÙŠÙØªØ­ Ø§Ù„Ù…Ù„Ù Ù…Ø¨Ø§Ø´Ø±Ø©.");
                    });

                    // Also re-upload the final version with QR code (overwrite)
                    finalPdf.getBase64((finalBase64) => {
                        const finalByteCharacters = atob(finalBase64);
                        const finalByteNumbers = new Array(finalByteCharacters.length);
                        for (let i = 0; i < finalByteCharacters.length; i++) {
                            finalByteNumbers[i] = finalByteCharacters.charCodeAt(i);
                        }
                        const finalByteArray = new Uint8Array(finalByteNumbers);
                        const finalBlob = new Blob([finalByteArray], { type: 'application/pdf' });

                        fetch(/api/upload?filename=booking-\.pdf, {
                            method: 'POST',
                            body: finalBlob
                        }).catch(err => console.error('Re-upload error:', err));
                    });
                })
                .catch(uploadErr => {
                    console.error("Cloud Upload Error:", uploadErr);
                    alert("ÙŠØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ø³Ø­Ø§Ø¨Ø© Ø­Ø§Ù„ÙŠØ§Ù‹. ØªÙ… Ø­ÙØ¸ ÙƒØ´Ù Ø§Ù„Ø±ÙƒØ§Ø¨ Ù…Ø­Ù„ÙŠØ§Ù‹ Ø¨Ø±Ù…Ø² QR Ø§Ø­ØªÙŠØ§Ø·ÙŠ.");
                    
                    // Fallback: generate PDF with text-only QR code
                    const fallbackQrData = Ù…Ø¤Ø³Ø³Ø© Ø²ÙˆØ§Ø± Ø·ÙŠØ¨Ø© Ù„Ù„Ù†Ù‚Ù„ Ø§Ù„Ø¨Ø±ÙŠ - ÙƒØ´Ù Ø±ÙƒØ§Ø¨ Ø±Ù‚Ù… \ - Ø§Ù„Ø³Ø§Ø¦Ù‚: \;
                    pdfData.qrUrl = fallbackQrData;
                    const fallbackDoc = buildPdfDocument(pdfData);
                    pdfMake.createPdf(fallbackDoc).download(Zowar-Taiba-Trip-Booking-\.pdf, () => {
                        statusNotice.remove();
                    });
                });
            });
        } catch (pdfErr) {
            statusNotice.remove();
            console.error("Fatal PDF Generation Error:", pdfErr);
            alert("Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø¥Ù†Ø´Ø§Ø¡ ÙƒØ´Ù Ø§Ù„Ø±ÙƒØ§Ø¨: " + pdfErr.message + "\nÙŠØ±Ø¬Ù‰ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø± 3 Ø«ÙˆØ§Ù†Ù Ø­ØªÙ‰ ÙŠÙƒØªÙ…Ù„ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø®Ø·ÙˆØ· Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø«Ù… Ø­Ø§ÙˆÙ„ Ù…Ø¬Ø¯Ø¯Ø§Ù‹.");
        }
    });

});