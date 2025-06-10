let currentStudentData = {
    studentInfo: { name: 'Jan Jansen', number: '12345', class: '4A' },
    weeklyData: [],
    summary: { average: 68, status: 'Voldoende', bestWeek: { week: 1, percentage: 80 }, worstWeek: { week: 5, percentage: 32 } },
    originalSummary: null
};

const API_ENDPOINTS = {
    studentData: window.studentDataUrl || '/api/student-data',
    weeklyData: window.weeklyDataUrl || '/api/weekly-data'
};

function processExcelData(excelData, targetStudentNumber = null) {
    console.log('Processing Excel data for student:', targetStudentNumber);

    let filteredData = excelData;
    if (targetStudentNumber) {
        filteredData = excelData.filter(row => row.studentnummer === targetStudentNumber);
    }

    const processedWeeks = filteredData.map(row => {
        const percentage = Math.round((row.aanwezigheid / row.rooster) * 100);
        return {
            week_number: row.week,
            percentage: percentage,
            minutes_present: row.aanwezigheid,
            total_minutes: row.rooster,
            year: row.jaar
        };
    });

    const summary = calculateSummaryFromWeeks(processedWeeks);

    const studentInfo = filteredData.length > 0 ? {
        name: getStudentNameFromNumber(filteredData[0].studentnummer),
        number: filteredData[0].studentnummer,
        class: getStudentClassFromNumber(filteredData[0].studentnummer)
    } : { name: 'Onbekend', number: 'Onbekend', class: 'Onbekend' };

    return {
        student: studentInfo,
        weeks: processedWeeks,
        summary: summary
    };
}

function calculateSummaryFromWeeks(weeks) {
    if (weeks.length === 0) {
        return { average: 0, bestWeek: { week: 1, percentage: 0 }, worstWeek: { week: 1, percentage: 0 } };
    }

    const average = Math.round(weeks.reduce((sum, week) => sum + week.percentage, 0) / weeks.length);
    const bestWeek = weeks.reduce((prev, current) => prev.percentage > current.percentage ? prev : current);
    const worstWeek = weeks.reduce((prev, current) => prev.percentage < current.percentage ? prev : current);

    return {
        average: average,
        bestWeek: { week: bestWeek.week_number, percentage: bestWeek.percentage },
        worstWeek: { week: worstWeek.week_number, percentage: worstWeek.percentage }
    };
}

function getStudentNameFromNumber(studentNumber) {
    return `Student ${studentNumber.slice(-4)}`;
}

function getStudentClassFromNumber(studentNumber) {
    const classes = ['4A', '4B', '4C', '3A', '3B'];
    const hash = studentNumber.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return classes[hash % classes.length];
}

function getUniqueStudentsFromExcel(excelData) {
    const uniqueStudents = {};
    excelData.forEach(row => {
        if (!uniqueStudents[row.studentnummer]) {
            uniqueStudents[row.studentnummer] = {
                studentnummer: row.studentnummer,
                name: getStudentNameFromNumber(row.studentnummer),
                class: getStudentClassFromNumber(row.studentnummer)
            };
        }
    });
    return Object.values(uniqueStudents);
}

async function importExcelData(file) {
    try {
        showLoadingState(true);

        if (typeof XLSX === 'undefined') {
            console.error('SheetJS library not loaded. Add to HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>');
            alert('Excel library niet geladen. Neem contact op met de developer.');
            return;
        }

        const fileBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(fileBuffer, {
            cellStyles: true,
            cellFormulas: true,
            cellDates: true
        });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Excel data imported:', jsonData.length, 'records');
        console.log('Available students:', getUniqueStudentsFromExcel(jsonData).map(s => s.studentnummer));

        const firstStudent = jsonData[0]?.studentnummer;
        if (firstStudent) {
            const processedData = processExcelData(jsonData, firstStudent);
            updateStudentData(processedData);
            console.log('Student data updated for:', firstStudent);
        }

    } catch (error) {
        console.error('Excel import failed:', error);
        alert('Excel import mislukt: ' + error.message);
    } finally {
        showLoadingState(false);
    }
}


async function loadStudentData(studentId = null, startWeek = null, endWeek = null, jaar = new Date().getFullYear()) {
    try {
        showLoadingState(true);
        const params = new URLSearchParams({ jaar: jaar });
        if (startWeek !== null) params.append('start_week', startWeek);
        if (endWeek !== null) params.append('end_week', endWeek);
        if (studentId) params.append('student_id', studentId);

        const response = await fetch(`${API_ENDPOINTS.studentData}?${params}`, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Backend data received:', data);
            const transformedData = transformBackendData(data);
            updateStudentData(transformedData);
        } else {
            console.warn('Backend not available, using demo data');
            loadDemoData();
        }
    } catch (error) {
        console.warn('Failed to load from backend:', error.message);
        loadDemoData();
    } finally {
        showLoadingState(false);
    }
}

function transformBackendData(data) {
    if (data.weeks) {
        data.weeks = data.weeks.map(week => ({
            week_number: week.week_number || week.week || week.weekNumber,
            percentage: week.percentage || Math.round((week.aanwezigheid / week.rooster) * 100),
            minutes_present: week.minutes_present || week.aanwezigheid,
            total_minutes: week.total_minutes || week.rooster,
            year: week.year || week.jaar
        }));
    }
    return data;
}


function populateWeekSelectors(weeklyData) {
    const startWeekSelect = document.getElementById('start-week');
    const endWeekSelect = document.getElementById('end-week');

    if (!startWeekSelect || !endWeekSelect || !weeklyData || weeklyData.length === 0) return;

    const availableWeeks = [...new Set(weeklyData.map(week => week.week_number))].sort((a, b) => a - b);

    const currentStartWeek = parseInt(startWeekSelect.value) || availableWeeks[0];
    const currentEndWeek = parseInt(endWeekSelect.value) || availableWeeks[availableWeeks.length - 1];

    startWeekSelect.innerHTML = '';
    endWeekSelect.innerHTML = '';

    availableWeeks.forEach(weekNumber => {
        const startOption = document.createElement('option');
        startOption.value = weekNumber;
        startOption.textContent = `Week ${weekNumber}`;
        if (weekNumber === currentStartWeek || (!availableWeeks.includes(currentStartWeek) && weekNumber === availableWeeks[0])) {
            startOption.selected = true;
        }
        startWeekSelect.appendChild(startOption);

        const endOption = document.createElement('option');
        endOption.value = weekNumber;
        endOption.textContent = `Week ${weekNumber}`;
        if (weekNumber === currentEndWeek || (!availableWeeks.includes(currentEndWeek) && weekNumber === availableWeeks[availableWeeks.length - 1])) {
            endOption.selected = true;
        }
        endWeekSelect.appendChild(endOption);
    });

    console.log(`Week selectors populated: ${availableWeeks.length} weeks (${availableWeeks[0]} - ${availableWeeks[availableWeeks.length - 1]})`);
}

function updateStudentData(data) {
    console.log('Updating student data:', data);

    if (data.student) updateStudentInfo(data.student);
    if (data.summary) {
        updateSummaryCards(data.summary);
        currentStudentData.originalSummary = { ...data.summary };
    }
    if (data.weeks && Array.isArray(data.weeks)) {
        updateWeeksGrid(data.weeks);
        currentStudentData.weeklyData = data.weeks;
        populateWeekSelectors(data.weeks);
    }
    currentStudentData = { ...currentStudentData, ...data };
}

function updateStudentInfo(student) {
    const fields = document.querySelectorAll('.student-field');
    if (fields.length >= 3) {
        fields[0].textContent = `Student Naam: ${student.name || 'Onbekend'}`;
        fields[1].textContent = `Student nr: ${student.number || student.studentnummer || 'Onbekend'}`;
        fields[2].textContent = `Student Klas: ${student.class || 'Onbekend'}`;
    }
}

function updateSummaryCards(summary) {
    const averageElement = document.getElementById('average');
    if (averageElement && summary.average !== undefined) {
        const currentAverage = parseInt(averageElement.textContent.replace('%', '')) || 0;
        animateNumber(averageElement, currentAverage, summary.average, 1000);
        setTimeout(() => averageElement.className = `value ${getScoreClass(summary.average)}`, 100);
    }

    const statusElement = document.getElementById('status');
    if (statusElement && summary.average !== undefined) {
        setTimeout(() => {
            statusElement.textContent = getStatusText(summary.average);
            statusElement.className = `value ${getScoreClass(summary.average)}`;
        }, 500);
    }

    const bestWeekElement = document.getElementById('best-week');
    if (bestWeekElement && summary.bestWeek) {
        bestWeekElement.textContent = `Week ${summary.bestWeek.week}`;
        bestWeekElement.className = `value ${getScoreClass(summary.bestWeek.percentage)}`;
    }

    const worstWeekElement = document.getElementById('worst-week');
    if (worstWeekElement && summary.worstWeek) {
        worstWeekElement.textContent = `Week ${summary.worstWeek.week}`;
        worstWeekElement.className = `value ${getScoreClass(summary.worstWeek.percentage)}`;
    }
}

function updateWeeksGrid(weeks) {
    const grid = document.getElementById('weeks-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const sortedWeeks = [...weeks].sort((a, b) => a.week_number - b.week_number);
    sortedWeeks.forEach((week, index) => {
        const weekCard = document.createElement('div');
        weekCard.className = 'week-card';
        weekCard.style.opacity = '0';
        weekCard.style.transform = 'translateY(20px)';

        const weekTitle = document.createElement('div');
        weekTitle.className = 'week-title';
        weekTitle.textContent = `Week ${week.week_number}`;

        const weekPercentage = document.createElement('div');
        weekPercentage.className = `week-percentage ${getScoreClass(week.percentage)}`;
        weekPercentage.textContent = `${week.percentage}%`;

        weekCard.appendChild(weekTitle);
        weekCard.appendChild(weekPercentage);
        grid.appendChild(weekCard);

        setTimeout(() => {
            weekCard.style.transition = 'all 0.3s ease';
            weekCard.style.opacity = '1';
            weekCard.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

function calculateFilteredStats(startWeek, endWeek) {
    const filteredWeeks = currentStudentData.weeklyData.filter(week => week.week_number >= startWeek && week.week_number <= endWeek);
    if (filteredWeeks.length === 0) return { average: 0, bestWeek: { week: startWeek, percentage: 0 }, worstWeek: { week: startWeek, percentage: 0 } };

    const average = Math.round(filteredWeeks.reduce((sum, week) => sum + week.percentage, 0) / filteredWeeks.length);
    const bestWeek = filteredWeeks.reduce((prev, current) => prev.percentage > current.percentage ? prev : current);
    const worstWeek = filteredWeeks.reduce((prev, current) => prev.percentage < current.percentage ? prev : current);

    return {
        average: average,
        bestWeek: { week: bestWeek.week_number, percentage: bestWeek.percentage },
        worstWeek: { week: worstWeek.week_number, percentage: worstWeek.percentage }
    };
}


function getScoreClass(percentage) {
    if (percentage >= 105) return 'exceptional';
    if (percentage >= 100) return 'perfect';
    if (percentage >= 95) return 'excellent';
    if (percentage >= 80) return 'goed';
    if (percentage >= 65) return 'voldoende';
    if (percentage >= 50) return 'onvoldoende';
    if (percentage > 0) return 'kritiek';
    return 'geen-aanwezigheid';
}

function getStatusText(percentage) {
    if (percentage >= 105) return 'Uitmuntend';
    if (percentage >= 100) return 'Perfect';
    if (percentage >= 95) return 'Excellent';
    if (percentage >= 80) return 'Goed';
    if (percentage >= 65) return 'Voldoende';
    if (percentage >= 50) return 'Onvoldoende';
    if (percentage > 0) return 'Kritiek';
    return 'Geen aanwezigheid';
}

function getPointColor(percentage) {
    if (percentage >= 105) return '#dc2626';
    if (percentage >= 100) return '#059669';
    if (percentage >= 85) return '#059669';
    if (percentage >= 70) return '#10b981';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
}


function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * easeOut);
        element.textContent = `${current}%`;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function showLoadingState(show) {
    const existingLoader = document.getElementById('loading-overlay');
    if (show && !existingLoader) {
        const loader = document.createElement('div');
        loader.id = 'loading-overlay';
        loader.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; font-size: 18px; color: #64748b;`;
        loader.innerHTML = `<div style="text-align: center;"><div class="spinner" style="margin: 0 auto 16px;"></div><div>Gegevens laden...</div></div>`;
        document.body.appendChild(loader);
    } else if (!show && existingLoader) {
        existingLoader.remove();
    }
}


function drawLineChart(startWeek, endWeek) {
    const svg = document.getElementById('line-chart');
    if (!svg) return;

    svg.innerHTML = '';
    svg.classList.remove('show');

    const filteredData = currentStudentData.weeklyData
        .filter(week => week.week_number >= startWeek && week.week_number <= endWeek)
        .map(week => ({ week: week.week_number, percentage: week.percentage }))
        .sort((a, b) => a.week - b.week);

    if (filteredData.length === 0) {
        svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#64748b">Geen data beschikbaar</text>';
        return;
    }

    const svgRect = svg.getBoundingClientRect();
    const width = svgRect.width || 400;
    const height = svgRect.height || 250;
    const padding = { top: 40, right: 40, bottom: 50, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const xScale = (index) => padding.left + (index / (filteredData.length - 1)) * chartWidth;
    const maxDataPercentage = Math.max(...filteredData.map(d => d.percentage));
    const maxPercentage = maxDataPercentage > 100 ? Math.ceil(maxDataPercentage / 10) * 10 : 100;
    const yScale = (percentage) => padding.top + ((maxPercentage - percentage) / maxPercentage) * chartHeight;

    let pathData = '';
    if (filteredData.length > 0) {
        pathData = `M ${xScale(0)} ${yScale(filteredData[0].percentage)}`;
        for (let i = 1; i < filteredData.length; i++) {
            const prevX = xScale(i - 1);
            const prevY = yScale(filteredData[i - 1].percentage);
            const currX = xScale(i);
            const currY = yScale(filteredData[i].percentage);
            const cp1x = prevX + (currX - prevX) * 0.5;
            const cp1y = prevY;
            const cp2x = currX - (currX - prevX) * 0.5;
            const cp2y = currY;
            pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${currX} ${currY}`;
        }
    }

    let areaPath = pathData;
    if (filteredData.length > 0) {
        areaPath += ` L ${xScale(filteredData.length - 1)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;
    }

    const gridLines = [];
    if (maxPercentage > 100) {
        const step = maxPercentage > 150 ? 25 : 20;
        for (let i = 0; i <= maxPercentage; i += step) gridLines.push(i);
        if (!gridLines.includes(100)) {
            gridLines.push(100);
            gridLines.sort((a, b) => a - b);
        }
    } else {
        gridLines.push(0, 25, 50, 75, 100);
    }

    svg.innerHTML = `
        <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.2" />
                <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0.02" />
            </linearGradient>
        </defs>
        ${gridLines.map((percentage, index) => {
        let strokeColor = '#e2e8f0', strokeWidth = '1';
        if (percentage === 0) { strokeColor = '#94a3b8'; strokeWidth = '2'; }
        else if (percentage === 100) { strokeColor = '#059669'; strokeWidth = '2'; }
        else if (percentage > 100) { strokeColor = '#dc2626'; strokeWidth = '1.5'; }
        return `
                <line x1="${padding.left}" y1="${yScale(percentage)}" x2="${padding.left + chartWidth}" y2="${yScale(percentage)}" 
                      stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="0" stroke-dasharray="${percentage > 100 ? '5,5' : 'none'}">
                    <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${index * 0.1}s" fill="freeze"/>
                </line>
                <text x="${padding.left - 10}" y="${yScale(percentage) + 5}" text-anchor="end" font-size="12" 
                      fill="${percentage > 100 ? '#dc2626' : '#64748b'}" font-weight="${percentage === 100 || percentage > 100 ? 'bold' : 'normal'}" opacity="0">
                    <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${index * 0.1}s" fill="freeze"/>
                    ${percentage}%
                </text>`;
    }).join('')}
        ${filteredData.map((point, index) => `<text x="${xScale(index)}" y="${padding.top + chartHeight + 25}" text-anchor="middle" font-size="13" fill="#64748b" font-weight="500" opacity="0">
            <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${index * 0.1 + 0.7}s" fill="freeze"/>Week ${point.week}</text>`).join('')}
        <line x1="${padding.left}" y1="${yScale(100)}" x2="${padding.left + chartWidth}" y2="${yScale(100)}" stroke="#059669" stroke-width="3" opacity="0">
            <animate attributeName="opacity" values="0;0.7" dur="0.5s" begin="1s" fill="freeze"/>
        </line>
        <path d="${areaPath}" fill="url(#areaGradient)" opacity="0"><animate attributeName="opacity" values="0;1" dur="1s" begin="1s" fill="freeze"/></path>
        <path d="${pathData}" stroke="#3b82f6" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
        ${filteredData.map((point, index) => {
        let pointColor = getPointColor(point.percentage);
        let pointSize = point.percentage > 100 ? '8' : '6';
        return `
                <circle cx="${xScale(index)}" cy="${yScale(point.percentage)}" r="0" fill="white" stroke="${pointColor}" stroke-width="3">
                    <animate attributeName="r" values="0;${pointSize}" dur="0.3s" begin="${1.5 + index * 0.1}s" fill="freeze"/>
                </circle>
                <text x="${xScale(index)}" y="${yScale(point.percentage) - 15}" text-anchor="middle" 
                      font-size="${point.percentage > 100 ? '13' : '12'}" fill="${pointColor}" font-weight="bold" opacity="0">
                    <animate attributeName="opacity" values="0;1" dur="0.3s" begin="${2 + index * 0.1}s" fill="freeze"/>
                    ${point.percentage}%
                </text>`;
    }).join('')}`;

    setTimeout(() => svg.classList.add('show'), 100);
}

function updateCircleChart(percentage) {
    const circle = document.getElementById('attendance-circle');
    const percentageText = document.getElementById('circle-percentage');
    if (!circle || !percentageText) return;

    const currentPercentage = parseInt(percentageText.textContent.replace('%', '')) || 0;
    let degree = percentage >= 100 ? 360 : (percentage / 100) * 360;
    let color = getPointColor(percentage);
    let currentDegree = currentPercentage >= 100 ? 360 : (currentPercentage / 100) * 360;

    const startTime = performance.now();
    const duration = 1500;

    function animateCircle(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const animatedDegree = currentDegree + (degree - currentDegree) * easeOut;

        if (percentage >= 100) {
            circle.style.background = `conic-gradient(${color} 0deg 360deg)`;
            circle.style.border = `4px solid ${color}`;
            circle.style.boxShadow = `0 0 20px ${color}40`;
            circle.classList.add('over-100');
        } else {
            circle.style.background = `conic-gradient(${color} 0deg ${animatedDegree}deg, #e5e7eb ${animatedDegree}deg 360deg)`;
            circle.style.border = 'none';
            circle.style.boxShadow = 'none';
            circle.classList.remove('over-100');
        }

        if (progress < 1) requestAnimationFrame(animateCircle);
    }

    requestAnimationFrame(animateCircle);
    animateNumber(percentageText, currentPercentage, percentage, 1500);
}


function loadDemoData() {
    const excelLikeData = [
        { studentnummer: 'st1121615364', aanwezigheid: 900, rooster: 900, week: 49, jaar: 2024 },
        { studentnummer: 'st1121615364', aanwezigheid: 720, rooster: 900, week: 48, jaar: 2024 },
        { studentnummer: 'st1121615364', aanwezigheid: 891, rooster: 900, week: 47, jaar: 2024 },
        { studentnummer: 'st1121615364', aanwezigheid: 950, rooster: 900, week: 46, jaar: 2024 },
        { studentnummer: 'st1121615364', aanwezigheid: 450, rooster: 900, week: 45, jaar: 2024 },
        { studentnummer: 'st1121615364', aanwezigheid: 810, rooster: 900, week: 44, jaar: 2024 },
        { studentnummer: 'st1121615364', aanwezigheid: 990, rooster: 900, week: 43, jaar: 2024 },
        { studentnummer: 'st1121615364', aanwezigheid: 855, rooster: 900, week: 42, jaar: 2024 }
    ];

    const processedData = processExcelData(excelLikeData, 'st1121615364');
    updateStudentData(processedData);
}


document.addEventListener('DOMContentLoaded', function () {
    const extraCSS = `.exceptional { color: #dc2626 !important; font-weight: bold; } .perfect { color: #059669 !important; font-weight: bold; } .week-percentage.exceptional { background: linear-gradient(135deg, #dc2626, #ef4444) !important; color: white !important; box-shadow: 0 0 15px rgba(220, 38, 38, 0.4) !important; } .week-percentage.perfect { background: linear-gradient(135deg, #059669, #10b981) !important; color: white !important; box-shadow: 0 0 10px rgba(5, 150, 105, 0.3) !important; } #attendance-circle.over-100 { animation: pulse-glow 2s infinite; } @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 25px rgba(5, 150, 105, 0.6); } 50% { box-shadow: 0 0 35px rgba(5, 150, 105, 0.8); } } .weeks-grid { max-height: 400px; overflow-y: auto; } .weeks-grid::-webkit-scrollbar { width: 6px; } .weeks-grid::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; } .weeks-grid::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }`;

    if (!document.getElementById('over-100-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'over-100-styles';
        styleElement.textContent = extraCSS;
        document.head.appendChild(styleElement);
    }

    loadStudentData();

    const filterBtn = document.getElementById('filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function () {
            const startWeek = parseInt(document.getElementById('start-week').value);
            const endWeek = parseInt(document.getElementById('end-week').value);
            if (startWeek > endWeek) { alert('Start week moet kleiner zijn dan eind week!'); return; }

            this.disabled = true;
            this.textContent = 'Laden...';
            const weeksSection = document.getElementById('weeks-section');
            const chartContainer = document.getElementById('chart-container');
            if (weeksSection) weeksSection.style.opacity = '0';

            setTimeout(() => {
                if (weeksSection) weeksSection.classList.add('hidden');
                if (chartContainer) chartContainer.classList.add('show');
                const filteredStats = calculateFilteredStats(startWeek, endWeek);
                updateSummaryCards(filteredStats);
                drawLineChart(startWeek, endWeek);
                updateCircleChart(filteredStats.average);
                const label = document.querySelector('.circle-chart div:last-child');
                if (label) label.textContent = `Week ${startWeek} - Week ${endWeek}`;
                filterBtn.disabled = false;
                filterBtn.textContent = 'Filteren';
            }, 300);
        });
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function () {
            const weeksSection = document.getElementById('weeks-section');
            const chartContainer = document.getElementById('chart-container');
            if (chartContainer) chartContainer.classList.remove('show');
            if (weeksSection) { weeksSection.classList.remove('hidden'); weeksSection.style.opacity = '1'; }
            if (currentStudentData.originalSummary) updateSummaryCards(currentStudentData.originalSummary);
        });
    }

    const jaarSelect = document.getElementById('jaar');
    if (jaarSelect) {
        jaarSelect.addEventListener('change', function () {
            loadStudentData(null, null, null, parseInt(this.value));
        });
    }

    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            const opt = { margin: 0.3, filename: 'student-overzicht.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
            html2pdf().from(document.querySelector('.container')).set(opt).save();
        });
    }

    const excelInput = document.getElementById('excel-input');
    if (excelInput) {
        excelInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                console.log('Excel file selected:', file.name);
                importExcelData(file);
            }
        });
    }
});


window.studentOverview = {
    updateStudentData: updateStudentData,
    loadStudentData: loadStudentData,
    processExcelData: processExcelData,

    importExcelData: importExcelData,
    getUniqueStudentsFromExcel: getUniqueStudentsFromExcel,

    calculateSummaryFromWeeks: calculateSummaryFromWeeks,
    transformBackendData: transformBackendData,

    populateWeekSelectors: populateWeekSelectors,
    updateWeeksGrid: updateWeeksGrid,
    updateSummaryCards: updateSummaryCards,

    drawLineChart: drawLineChart,
    updateCircleChart: updateCircleChart,

    getCurrentData: () => currentStudentData,

    refresh: () => loadStudentData()
};

window.updateStudentData = updateStudentData;
window.loadStudentData = loadStudentData;
window.refreshStudentData = () => loadStudentData();

console.log('Student Overview System Ready - Production Ready!');