// ==============================================
// IMPORT PAGE JAVASCRIPT - FIXED FOR CURRENT HTML
// ==============================================

// Global variables
let selectedFile = null;

// Laravel URLs (set by Blade template)
const uploadUrl = window.uploadUrl || '/import/upload';
const historyUrl = window.historyUrl || '/import/history';

// AAR file validation according to specification
const aarValidation = {
    filenamePattern: /^AAR_(\d{4})_W(\d{1,2})_([a-zA-Z0-9]+)\.(xlsx|xls|ods)$/,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.xlsx', '.xls', '.ods']
};

// ==============================================
// FILE HANDLING FUNCTIONS
// ==============================================

function handleFileSelect(event) {
    const file = event.target.files[0];
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileDetails = document.getElementById('fileDetails');
    const uploadBtn = document.getElementById('uploadBtn');

    if (file) {
        console.log('File selected:', file.name);

        // Validate file
        const validation = validateFile(file);

        if (!validation.valid) {
            showStatus(validation.message, 'error');
            clearFileSelection();
            return;
        }

        // File is valid
        selectedFile = file;

        // Update UI
        fileName.textContent = file.name;

        // Create enhanced file details with AAR info
        let details = `Grootte: ${formatFileSize(file.size)} | Type: ${file.type || getFileExtension(file.name)}`;

        const aarInfo = parseAARFilename(file.name);
        if (aarInfo.valid) {
            details += `\n📅 Jaar: ${aarInfo.year} | 📊 Week: ${aarInfo.week} | 🏷️ Code: ${aarInfo.code}`;
        }

        fileDetails.textContent = details;
        fileInfo.classList.add('show');
        uploadBtn.disabled = false;

        // Show success message
        showStatus('Bestand gevalideerd en klaar voor upload!', 'success');

        // Hide previous status messages
        setTimeout(hideStatus, 3000);
    } else {
        clearFileSelection();
    }
}

function validateFile(file) {
    // Check file type
    const allowedTypes = ['.xlsx', '.xls', '.ods'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
        return {
            valid: false,
            message: `Ongeldig bestandstype: ${fileExtension}. Alleen .xlsx, .xls en .ods bestanden zijn toegestaan.`
        };
    }

    // Check file size (max 10MB)
    if (file.size > aarValidation.maxFileSize) {
        return {
            valid: false,
            message: `Bestand is te groot: ${formatFileSize(file.size)}. Maximum grootte is ${formatFileSize(aarValidation.maxFileSize)}.`
        };
    }

    if (file.size === 0) {
        return {
            valid: false,
            message: 'Bestand is leeg.'
        };
    }

    // Check filename pattern
    const aarInfo = parseAARFilename(file.name);
    if (!aarInfo.valid) {
        return {
            valid: false,
            message: 'Bestandsnaam moet het AAR formaat hebben: AAR_[JAAR]_W[WEEK]_[CODE].[extensie]'
        };
    }

    // Validate year and week
    const currentYear = new Date().getFullYear();
    if (aarInfo.year < 2020 || aarInfo.year > currentYear + 1) {
        return {
            valid: false,
            message: `Ongeldig jaar: ${aarInfo.year}. Verwacht tussen 2020 en ${currentYear + 1}.`
        };
    }

    if (aarInfo.week < 1 || aarInfo.week > 53) {
        return {
            valid: false,
            message: `Ongeldige week: ${aarInfo.week}. Verwacht tussen 1 en 53.`
        };
    }

    return {
        valid: true,
        message: 'Bestand is geldig!'
    };
}

function parseAARFilename(filename) {
    const match = filename.match(aarValidation.filenamePattern);
    if (match) {
        return {
            valid: true,
            year: parseInt(match[1]),
            week: parseInt(match[2]),
            code: match[3],
            extension: match[4]
        };
    }
    return { valid: false };
}

function clearFileSelection() {
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').classList.remove('show');
    document.getElementById('uploadBtn').disabled = true;
    document.getElementById('fileName').textContent = 'Geen bestand geselecteerd';
    document.getElementById('fileDetails').textContent = 'Selecteer een AAR-bestand om te uploaden';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
    return '.' + filename.split('.').pop().toLowerCase();
}

// ==============================================
// UPLOAD FUNCTIONS
// ==============================================

async function uploadFile() {
    if (!selectedFile) {
        showStatus('Selecteer eerst een bestand.', 'error');
        return;
    }

    try {
        console.log('Starting upload for:', selectedFile.name);

        // Start upload process
        showUploadProgress(true);
        setUploadProgress(0);
        showStatus('Bestand wordt geüpload...', 'success');

        // Disable upload button during upload
        const uploadBtn = document.getElementById('uploadBtn');
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';

        // Create form data
        const formData = new FormData();
        formData.append('aar_file', selectedFile);
        formData.append('_token', getCSRFToken());

        // Add parsed AAR information
        const aarInfo = parseAARFilename(selectedFile.name);
        if (aarInfo.valid) {
            formData.append('detected_year', aarInfo.year);
            formData.append('detected_week', aarInfo.week);
            formData.append('detected_code', aarInfo.code);
        }

        // Simulate progress
        simulateProgress();

        // Send to Laravel backend
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Upload successful
            const message = result.message || `Bestand "${selectedFile.name}" is succesvol geïmporteerd`;
            const recordCount = result.records_imported || 0;

            showStatus(`${message} (${recordCount} records geïmporteerd)`, 'success');
            addToHistory(selectedFile.name, 'Succesvol', recordCount);
            clearFileSelection();

            // Refresh history table
            setTimeout(loadImportHistory, 1000);
        } else {
            // Upload failed
            const errorMessage = result.message || result.error || 'Er is een fout opgetreden tijdens het uploaden.';
            showStatus(`Upload gefaald: ${errorMessage}`, 'error');
            addToHistory(selectedFile.name, 'Gefaald', 0, errorMessage);
        }

    } catch (error) {
        console.error('Upload error:', error);

        // Handle different types of errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showStatus('Kan geen verbinding maken met server. Backend nog niet gereed?', 'error');
        } else {
            showStatus(`Upload gefaald: ${error.message}`, 'error');
        }

        addToHistory(selectedFile.name, 'Gefaald', 0, error.message);
    } finally {
        // Reset upload state
        showUploadProgress(false);
        setUploadProgress(0);

        const uploadBtn = document.getElementById('uploadBtn');
        uploadBtn.textContent = 'Upload Bestand';
        uploadBtn.disabled = selectedFile === null;
    }
}

// ==============================================
// PROGRESS FUNCTIONS
// ==============================================

function showUploadProgress(show) {
    const uploadProgress = document.getElementById('uploadProgress');
    if (uploadProgress) {
        uploadProgress.style.display = show ? 'block' : 'none';
    }
}

function setUploadProgress(percentage) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (progressFill) progressFill.style.width = percentage + '%';
    if (progressText) progressText.textContent = Math.round(percentage) + '%';
}

function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;

        setUploadProgress(progress);

        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 200);
}

// ==============================================
// STATUS MESSAGE FUNCTIONS
// ==============================================

function showStatus(message, type = 'success') {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                hideStatus();
            }, 5000);
        }
    } else {
        // Fallback to console if status element doesn't exist
        console.log(`Status (${type}):`, message);
    }
}

function hideStatus() {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.style.display = 'none';
    }
}

// ==============================================
// HISTORY TABLE FUNCTIONS
// ==============================================

function addToHistory(filename, status, recordsImported = 0, errorMessage = '') {
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody) return;

    const now = new Date();
    const date = now.toLocaleDateString('nl-NL');
    const time = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

    const row = document.createElement('tr');
    const statusClass = status === 'Succesvol' ? 'status-succesvol' : 'status-gefaald';

    // Enhanced filename display with AAR info
    const aarInfo = parseAARFilename(filename);
    let filenameDisplay = filename;
    if (aarInfo.valid) {
        filenameDisplay += `<br><small style="color: #6b7280; font-size: 11px;">${aarInfo.year}, Week ${aarInfo.week}</small>`;
    }

    row.innerHTML = `
        <td>${date}</td>
        <td>${time}</td>
        <td>${filenameDisplay}</td>
        <td>${recordsImported || '-'}</td>
        <td><span class="${statusClass}">${status}</span></td>
    `;

    // Add new row at the beginning
    tableBody.insertBefore(row, tableBody.firstChild);

    // Remove empty message if exists
    const emptyRow = tableBody.querySelector('td[colspan="5"]');
    if (emptyRow) {
        emptyRow.parentElement.remove();
    }
}

async function loadImportHistory() {
    try {
        const response = await fetch(historyUrl, {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response.ok) {
            const history = await response.json();
            updateHistoryTable(history);
        } else {
            console.log('Backend not ready - using demo data');
            loadDemoHistory();
        }
    } catch (error) {
        console.log('Backend not available - loading demo data');
        loadDemoHistory();
    }
}

function loadDemoHistory() {
    const demoHistory = [
        {
            date: new Date(Date.now() - 86400000).toLocaleDateString('nl-NL'),
            time: '14:30',
            filename: 'AAR_2024_W12_ABC123.xlsx',
            records_imported: 45,
            status: 'Succesvol'
        },
        {
            date: new Date(Date.now() - 172800000).toLocaleDateString('nl-NL'),
            time: '09:15',
            filename: 'AAR_2024_W11_DEF456.xlsx',
            records_imported: 0,
            status: 'Gefaald'
        }
    ];

    updateHistoryTable(demoHistory);
}

function updateHistoryTable(history) {
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (history.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #64748b;">
                    Nog geen imports uitgevoerd
                </td>
            </tr>
        `;
        return;
    }

    history.forEach(record => {
        const row = document.createElement('tr');
        const statusClass = record.status === 'Succesvol' ? 'status-succesvol' : 'status-gefaald';

        // Parse filename for additional info
        const aarInfo = parseAARFilename(record.filename);
        let filenameDisplay = record.filename;
        if (aarInfo.valid) {
            filenameDisplay += `<br><small style="color: #6b7280; font-size: 11px;">${aarInfo.year}, Week ${aarInfo.week}</small>`;
        }

        row.innerHTML = `
            <td>${record.date}</td>
            <td>${record.time}</td>
            <td>${filenameDisplay}</td>
            <td>${record.records_imported || '-'}</td>
            <td><span class="${statusClass}">${record.status}</span></td>
        `;

        tableBody.appendChild(row);
    });
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

function getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : '';
}

// ==============================================
// DRAG & DROP FUNCTIONALITY
// ==============================================

function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;

    uploadArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function (e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function (e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.files = files;
                handleFileSelect({ target: fileInput });
            }
        }
    });
}

// ==============================================
// DEMO FUNCTIONS
// ==============================================

function demonstrateUpload() {
    // Create a fake file for testing
    const blob = new Blob(['Demo content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const file = new File([blob], 'AAR_2024_W15_DEMO123.xlsx', { type: blob.type });

    // Simulate file selection
    const fakeEvent = {
        target: {
            files: [file]
        }
    };

    handleFileSelect(fakeEvent);
    console.log('Demo file selected! Click Upload to test.');
}

// ==============================================
// INITIALIZATION
// ==============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('Import page initializing...');

    // Setup drag & drop
    setupDragAndDrop();

    // Load import history from backend
    loadImportHistory();

    console.log('Import page initialized successfully!');
    console.log('Try: demonstrateUpload() to test file selection');
});

// ==============================================
// ERROR HANDLING
// ==============================================

window.addEventListener('error', function (e) {
    console.error('JavaScript error:', e.error);
    showStatus('Er is een onverwachte fout opgetreden.', 'error');
});

window.addEventListener('unhandledrejection', function (e) {
    console.error('Network error:', e.reason);
    if (e.reason.message && e.reason.message.includes('fetch')) {
        showStatus('Backend nog niet beschikbaar - frontend is klaar.', 'warning');
    } else {
        showStatus('Netwerkfout: Controleer je internetverbinding.', 'error');
    }
});

// Make demo function available globally
window.demonstrateUpload = demonstrateUpload;




// hier is een test

// Force demo history
function forceLoadDemoHistory() {
    const tableBody = document.getElementById('historyTableBody');
    console.log('Found table body:', tableBody);

    if (!tableBody) {
        console.log('ERROR: historyTableBody element not found!');
        return;
    }

    // Clear existing content
    tableBody.innerHTML = '';

    // Add demo data
    const demoData = [
        {
            date: '5-6-2025',
            time: '14:30',
            filename: 'AAR_2024_W12_ABC123.xlsx',
            records_imported: 45,
            status: 'Succesvol'
        },
        {
            date: '4-6-2025',
            time: '09:15',
            filename: 'AAR_2024_W11_DEF456.xlsx',
            records_imported: 0,
            status: 'Gefaald'
        }
    ];

    demoData.forEach(record => {
        const row = document.createElement('tr');
        const statusClass = record.status === 'Succesvol' ? 'status-succesvol' : 'status-gefaald';

        row.innerHTML = `
            <td>${record.date}</td>
            <td>${record.time}</td>
            <td>${record.filename}<br><small style="color: #6b7280; font-size: 11px;">2024, Week 12</small></td>
            <td>${record.records_imported || '-'}</td>
            <td><span class="${statusClass}">${record.status}</span></td>
        `;

        tableBody.appendChild(row);
    });

    console.log('Demo history added successfully!');
}

forceLoadDemoHistory();

demonstrateUpload()

// Check wat er mis is met loadDemoHistory
console.log('Testing loadDemoHistory...');
const tableBody = document.getElementById('historyTableBody');
console.log('Table body element:', tableBody);
console.log('Current table content:', tableBody.innerHTML);

// Force clear and add demo data
tableBody.innerHTML = '';

// Add demo rows
tableBody.innerHTML = `
    <tr>
        <td>5-6-2025</td>
        <td>14:30</td>
        <td>AAR_2024_W12_ABC123.xlsx<br><small style="color: #6b7280; font-size: 11px;">2024, Week 12</small></td>
        <td>45</td>
        <td><span class="status-succesvol">Succesvol</span></td>
    </tr>
    <tr>
        <td>4-6-2025</td>
        <td>09:15</td>
        <td>AAR_2024_W11_DEF456.xlsx<br><small style="color: #6b7280; font-size: 11px;">2024, Week 11</small></td>
        <td>-</td>
        <td><span class="status-gefaald">Gefaald</span></td>
    </tr>
`;

console.log('Demo history should now be visible!');