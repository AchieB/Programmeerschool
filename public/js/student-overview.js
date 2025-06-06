
let currentStudentData = {
    studentInfo: {
        name: 'Jan Jansen',
        number: '12345',
        class: '4A'
    },
    weeklyData: [],
    summary: {
        average: 68,
        status: 'Voldoende',
        bestWeek: { week: 1, percentage: 80 },
        worstWeek: { week: 5, percentage: 32 }
    },
    originalSummary: null
};

const API_ENDPOINTS = {
    studentData: window.studentDataUrl || '/api/student-data',
    weeklyData: window.weeklyDataUrl || '/api/weekly-data'
};


async function loadStudentData(studentId = null, startWeek = 1, endWeek = 12) {
    try {
        showLoadingState(true);

        const params = new URLSearchParams({
            start_week: startWeek,
            end_week: endWeek
        });

        if (studentId) {
            params.append('student_id', studentId);
        }

        const response = await fetch(`${API_ENDPOINTS.studentData}?${params}`, {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateStudentData(data);
        } else {
            console.warn('Backend not ready, using demo data');
            loadDemoData();
        }
    } catch (error) {
        console.warn('Failed to load from backend:', error.message);
        loadDemoData();
    } finally {
        showLoadingState(false);
    }
}

function updateStudentData(data) {
    console.log('Updating student data:', data);

    if (data.student) {
        updateStudentInfo(data.student);
    }

    if (data.summary) {
        updateSummaryCards(data.summary);
        currentStudentData.originalSummary = { ...data.summary };
    }

    if (data.weeks && Array.isArray(data.weeks)) {
        updateWeeksGrid(data.weeks);
        currentStudentData.weeklyData = data.weeks;
    }

    currentStudentData = { ...currentStudentData, ...data };
}

function updateStudentInfo(student) {
    const fields = document.querySelectorAll('.student-field');

    if (fields.length >= 3) {
        fields[0].textContent = `Student Naam: ${student.name || 'Onbekend'}`;
        fields[1].textContent = `Student nr: ${student.number || 'Onbekend'}`;
        fields[2].textContent = `Student Klas: ${student.class || 'Onbekend'}`;
    }
}

function updateSummaryCards(summary) {
    console.log('Updating summary cards with:', summary);

    const averageElement = document.getElementById('average');
    if (averageElement && summary.average !== undefined) {
        const currentAverage = parseInt(averageElement.textContent.replace('%', '')) || 0;
        animateNumber(averageElement, currentAverage, summary.average, 1000);

        setTimeout(() => {
            averageElement.className = `value ${getScoreClass(summary.average)}`;
        }, 100);
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

    weeks.forEach((week, index) => {
        const weekCard = document.createElement('div');
        weekCard.className = 'week-card';
        weekCard.style.opacity = '0';
        weekCard.style.transform = 'translateY(20px)';

        const weekTitle = document.createElement('div');
        weekTitle.className = 'week-title';
        weekTitle.textContent = `Week ${week.week_number || index + 1}`;

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
        }, index * 100);
    });
}


function calculateFilteredStats(startWeek, endWeek) {
    console.log(`Calculating stats for Week ${startWeek} to ${endWeek}`);

    const filteredWeeks = currentStudentData.weeklyData
        .filter(week => week.week_number >= startWeek && week.week_number <= endWeek);

    console.log('Filtered weeks:', filteredWeeks);

    if (filteredWeeks.length === 0) {
        return {
            average: 0,
            bestWeek: { week: startWeek, percentage: 0 },
            worstWeek: { week: startWeek, percentage: 0 }
        };
    }

    const average = Math.round(
        filteredWeeks.reduce((sum, week) => sum + week.percentage, 0) / filteredWeeks.length
    );

    const bestWeek = filteredWeeks.reduce((prev, current) =>
        prev.percentage > current.percentage ? prev : current
    );

    const worstWeek = filteredWeeks.reduce((prev, current) =>
        prev.percentage < current.percentage ? prev : current
    );

    const result = {
        average: average,
        bestWeek: {
            week: bestWeek.week_number,
            percentage: bestWeek.percentage
        },
        worstWeek: {
            week: worstWeek.week_number,
            percentage: worstWeek.percentage
        }
    };

    console.log('Calculated filtered stats:', result);
    return result;
}

function updateFilteredSummaryCards(filteredStats) {
    console.log('Updating summary cards with filtered stats:', filteredStats);

    const averageElement = document.getElementById('average');
    if (averageElement) {
        const currentAverage = parseInt(averageElement.textContent.replace('%', '')) || 0;
        console.log(`Animating average from ${currentAverage}% to ${filteredStats.average}%`);
        animateNumber(averageElement, currentAverage, filteredStats.average, 1000);

        setTimeout(() => {
            averageElement.className = `value ${getScoreClass(filteredStats.average)}`;
        }, 100);
    }

    const statusElement = document.getElementById('status');
    if (statusElement) {
        setTimeout(() => {
            const newStatus = getStatusText(filteredStats.average);
            console.log(`Updating status to: ${newStatus}`);
            statusElement.textContent = newStatus;
            statusElement.className = `value ${getScoreClass(filteredStats.average)}`;
        }, 500);
    }

    const bestWeekElement = document.getElementById('best-week');
    if (bestWeekElement && filteredStats.bestWeek) {
        bestWeekElement.textContent = `Week ${filteredStats.bestWeek.week}`;
        bestWeekElement.className = `value ${getScoreClass(filteredStats.bestWeek.percentage)}`;
    }

    const worstWeekElement = document.getElementById('worst-week');
    if (worstWeekElement && filteredStats.worstWeek) {
        worstWeekElement.textContent = `Week ${filteredStats.worstWeek.week}`;
        worstWeekElement.className = `value ${getScoreClass(filteredStats.worstWeek.percentage)}`;
    }
}

function restoreOriginalSummaryCards() {
    console.log('Restoring original summary cards:', currentStudentData.originalSummary);

    if (currentStudentData.originalSummary) {
        updateSummaryCards(currentStudentData.originalSummary);
    }
}


function loadDemoData() {
    const demoData = {
        student: {
            name: 'Jan Jansen',
            number: '12345',
            class: '4A'
        },
        summary: {
            average: 68,
            bestWeek: { week: 7, percentage: 88 },
            worstWeek: { week: 5, percentage: 32 }
        },
        weeks: [
            { week_number: 1, percentage: 80, minutes_present: 45, total_minutes: 50 },
            { week_number: 2, percentage: 80, minutes_present: 48, total_minutes: 50 },
            { week_number: 3, percentage: 81, minutes_present: 49, total_minutes: 50 },
            { week_number: 4, percentage: 80, minutes_present: 40, total_minutes: 50 },
            { week_number: 5, percentage: 32, minutes_present: 16, total_minutes: 50 },
            { week_number: 6, percentage: 84, minutes_present: 42, total_minutes: 50 },
            { week_number: 7, percentage: 88, minutes_present: 44, total_minutes: 50 },
            { week_number: 8, percentage: 72, minutes_present: 36, total_minutes: 50 },
            { week_number: 9, percentage: 58, minutes_present: 29, total_minutes: 50 },
            { week_number: 10, percentage: 45, minutes_present: 22, total_minutes: 50 },
            { week_number: 11, percentage: 83, minutes_present: 41, total_minutes: 50 },
            { week_number: 12, percentage: 69, minutes_present: 34, total_minutes: 50 }
        ]
    };

    updateStudentData(demoData);
}


function getScoreClass(percentage) {
    if (percentage >= 100) return 'perfect';
    if (percentage >= 95) return 'excellent';
    if (percentage >= 80) return 'goed';
    if (percentage >= 65) return 'voldoende';
    if (percentage >= 50) return 'onvoldoende';
    if (percentage > 0) return 'kritiek';
    return 'geen-aanwezigheid';
}

function getStatusText(percentage) {
    if (percentage >= 100) return 'Perfect';
    if (percentage >= 95) return 'Excellent';
    if (percentage >= 80) return 'Goed';
    if (percentage >= 65) return 'Voldoende';
    if (percentage >= 50) return 'Onvoldoende';
    if (percentage > 0) return 'Kritiek';
    return 'Geen aanwezigheid';
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * easeOut);

        element.textContent = `${current}%`;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function showLoadingState(show) {
    const existingLoader = document.getElementById('loading-overlay');

    if (show && !existingLoader) {
        const loader = document.createElement('div');
        loader.id = 'loading-overlay';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-size: 18px;
            color: #64748b;
        `;
        loader.innerHTML = `
            <div style="text-align: center;">
                <div class="spinner" style="margin: 0 auto 16px;"></div>
                <div>Gegevens laden...</div>
            </div>
        `;
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
        .map(week => ({
            week: week.week_number,
            percentage: week.percentage
        }));

    if (filteredData.length === 0) {
        svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#64748b">Geen data beschikbaar</text>';
        return;
    }

    const svgRect = svg.getBoundingClientRect();
    const width = svgRect.width || 400;
    const height = svgRect.height || 250;
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const xScale = (index) => padding.left + (index / (filteredData.length - 1)) * chartWidth;
    const yScale = (percentage) => padding.top + (100 - percentage) / 100 * chartHeight;

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
        areaPath += ` L ${xScale(filteredData.length - 1)} ${yScale(0)}`;
        areaPath += ` L ${xScale(0)} ${yScale(0)} Z`;
    }

    svg.innerHTML = `
        <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.2" />
                <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0.02" />
            </linearGradient>
        </defs>
        
        <!-- Grid lines -->
        ${[0, 25, 50, 75, 100].map((percentage, index) =>
        `<line x1="${padding.left}" y1="${yScale(percentage)}" x2="${padding.left + chartWidth}" y2="${yScale(percentage)}" 
                   stroke="${percentage === 0 ? '#94a3b8' : '#e2e8f0'}" stroke-width="${percentage === 0 ? '2' : '1'}" opacity="0">
                <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${index * 0.1}s" fill="freeze"/>
            </line>`
    ).join('')}
        
        <!-- X-axis labels -->
        ${filteredData.map((point, index) =>
        `<text x="${xScale(index)}" y="${padding.top + chartHeight + 25}" text-anchor="middle" font-size="13" fill="#64748b" font-weight="500" opacity="0">
                <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${index * 0.1 + 0.7}s" fill="freeze"/>
                Week ${point.week}
            </text>`
    ).join('')}
        
        <!-- Area fill -->
        <path d="${areaPath}" fill="url(#areaGradient)" opacity="0">
            <animate attributeName="opacity" values="0;1" dur="1s" begin="1s" fill="freeze"/>
        </path>
        
        <!-- Main line -->
        <path d="${pathData}" stroke="#3b82f6" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round">
        </path>
        
        <!-- Data points -->
        ${filteredData.map((point, index) => {
        let pointColor = getPointColor(point.percentage);
        return `
                <circle cx="${xScale(index)}" cy="${yScale(point.percentage)}" r="0" fill="white" stroke="${pointColor}" stroke-width="3">
                    <animate attributeName="r" values="0;6" dur="0.3s" begin="${1.5 + index * 0.1}s" fill="freeze"/>
                </circle>
                <text x="${xScale(index)}" y="${yScale(point.percentage) - 15}" text-anchor="middle" 
                      font-size="12" fill="${pointColor}" font-weight="bold" opacity="0">
                    <animate attributeName="opacity" values="0;1" dur="0.3s" begin="${2 + index * 0.1}s" fill="freeze"/>
                    ${point.percentage}%
                </text>
            `;
    }).join('')}
    `;

    setTimeout(() => svg.classList.add('show'), 100);
}

function getPointColor(percentage) {
    if (percentage >= 85) return '#059669';
    if (percentage >= 70) return '#10b981';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
}

function updateCircleChart(percentage) {
    const circle = document.getElementById('attendance-circle');
    const percentageText = document.getElementById('circle-percentage');

    if (!circle || !percentageText) return;

    const currentPercentage = parseInt(percentageText.textContent.replace('%', '')) || 0;
    const degree = (percentage / 100) * 360;
    let color = getPointColor(percentage);

    // Animate the circle
    let currentDegree = (currentPercentage / 100) * 360;
    const startTime = performance.now();
    const duration = 1500;

    function animateCircle(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const animatedDegree = currentDegree + (degree - currentDegree) * easeOut;

        circle.style.background = `conic-gradient(${color} 0deg ${animatedDegree}deg, #e5e7eb ${animatedDegree}deg 360deg)`;

        if (progress < 1) {
            requestAnimationFrame(animateCircle);
        }
    }

    requestAnimationFrame(animateCircle);
    animateNumber(percentageText, currentPercentage, percentage, 1500);
}


document.addEventListener('DOMContentLoaded', function () {
    console.log('Student overview initializing...');

    loadStudentData();

    const filterBtn = document.getElementById('filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function () {
            const startWeek = parseInt(document.getElementById('start-week').value);
            const endWeek = parseInt(document.getElementById('end-week').value);

            console.log(`Filter button clicked: Week ${startWeek} to ${endWeek}`);

            if (startWeek > endWeek) {
                alert('Start week moet kleiner zijn dan eind week!');
                return;
            }

            this.disabled = true;
            this.textContent = 'Laden...';

            const weeksSection = document.getElementById('weeks-section');
            const chartContainer = document.getElementById('chart-container');

            if (weeksSection) weeksSection.style.opacity = '0';

            setTimeout(() => {
                if (weeksSection) weeksSection.classList.add('hidden');
                if (chartContainer) chartContainer.classList.add('show');

                const filteredStats = calculateFilteredStats(startWeek, endWeek);

                updateFilteredSummaryCards(filteredStats);

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
            console.log('Back button clicked - restoring original view');

            const weeksSection = document.getElementById('weeks-section');
            const chartContainer = document.getElementById('chart-container');

            if (chartContainer) chartContainer.classList.remove('show');
            if (weeksSection) {
                weeksSection.classList.remove('hidden');
                weeksSection.style.opacity = '1';
            }

            restoreOriginalSummaryCards();
        });
    }
});

window.updateStudentData = updateStudentData;
window.loadStudentData = loadStudentData;
window.refreshStudentData = () => loadStudentData();

window.debugCurrentData = () => {
    console.log('Current student data:', currentStudentData);
    console.log('Original summary:', currentStudentData.originalSummary);
};

console.log('Student overview FIXED version loaded!');