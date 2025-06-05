// HOOFDFUNCTIE - Dit is wat je backend collega aanroept
function updateStudentData(data) {
    // Update summary cards met nieuwe gegevens
    if (data.studentCount) {
        document.getElementById('student-count').textContent = data.studentCount;
    }
    if (data.average) {
        document.getElementById('average').textContent = `${data.average}%`;
        document.getElementById('average').className = `value ${getScoreClass(data.average)}`;
    }
    if (data.zeroStudents !== undefined) {
        document.getElementById('zero-students').textContent = data.zeroStudents;
    }
    if (data.topStudents !== undefined) {
        document.getElementById('top-students').textContent = data.topStudents;
    }

    // Update weeks grid
    if (data.weeks && Array.isArray(data.weeks)) {
        updateWeeksGrid(data.weeks);
    }
}

// WEEK GRID FUNCTIE - Maakt alle week kaartjes opnieuw met nieuwe kleuren
function updateWeeksGrid(weeks) {
    const grid = document.getElementById('weeks-grid');
    grid.innerHTML = '';

    weeks.forEach((week, index) => {
        const weekCard = document.createElement('div');
        weekCard.className = 'week-card';

        const weekTitle = document.createElement('div');
        weekTitle.className = 'week-title';
        weekTitle.textContent = `Week ${index + 1}`;

        const weekPercentage = document.createElement('div');
        weekPercentage.className = `week-percentage ${getScoreClass(week.percentage)}`;
        weekPercentage.textContent = `${week.percentage}%`;

        weekCard.appendChild(weekTitle);
        weekCard.appendChild(weekPercentage);
        grid.appendChild(weekCard);
    });
}

// KLEUR FUNCTIE - Volgens jouw categorisering
function getScoreClass(percentage) {
    if (percentage >= 100) return 'perfect';
    if (percentage >= 95) return 'excellent';
    if (percentage >= 80) return 'goed';
    if (percentage >= 65) return 'voldoende';
    if (percentage >= 50) return 'onvoldoende';
    if (percentage > 0) return 'kritiek';
    return 'geen-aanwezigheid';
}

// TEST FUNCTIE - Om de nieuwe stijl te testen
function testNewStyle() {
    const testData = {
        studentCount: 6,
        average: 68,
        zeroStudents: 2,
        topStudents: 2,
        weeks: [
            { percentage: 100 }, // Week 1: Perfect
            { percentage: 97 },  // Week 2: Excellent
            { percentage: 85 },  // Week 3: Goed
            { percentage: 70 },  // Week 4: Voldoende
            { percentage: 55 },  // Week 5: Onvoldoende
            { percentage: 30 },  // Week 6: Kritiek
            { percentage: 0 },   // Week 7: Geen aanwezigheid
            { percentage: 92 },  // Week 8: Goed
            { percentage: 67 },  // Week 9: Voldoende
            { percentage: 43 },  // Week 10: Kritiek
            { percentage: 81 },  // Week 11: Goed
            { percentage: 74 }   // Week 12: Voldoende
        ]
    };

    updateStudentData(testData);
    console.log("Nieuwe moderne stijl geladen!");
}

// AUTOMATISCHE TEST - Laadt test data na 2 seconden
setTimeout(testNewStyle, 2000);

// Event listeners voor de dropdown
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', function () {
        console.log('Geselecteerde week:', this.textContent);
        // Hier kan je de logica toevoegen voor week selectie
    });
});

// Event listener voor filter button
document.querySelector('.btn').addEventListener('click', function () {
    console.log('Filter button geklikt');
    // Hier kan je de logica toevoegen voor filteren
});