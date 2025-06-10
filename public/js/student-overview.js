let currentStudentData = {
	studentInfo: { name: 'Jan Jansen', number: '12345', class: '4A' },
	weeklyData: [],
	summary: { average: 68, status: 'Voldoende', bestWeek: { week: 1, percentage: 80 }, worstWeek: { week: 5, percentage: 32 } },
	originalSummary: null
};

// Fix the API endpoints definition at the top of your file
const API_ENDPOINTS = {
	studentData: window.studentDataUrl || '/api/students',
	weeklyData: window.weeklyDataUrl || '/api/weekly-progress'
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


async function loadStudentData(studentId = null, startWeek = 1, endWeek = 52) {
	try {
		showLoadingState(true);
		console.log('Loading student data...');

		// Use the studentnummer from parameters, window object, or null
		const studentNummer = studentId || window.studentnummer || null;
		console.log('Using student number:', studentNummer);

		if (studentNummer) {
			// Get the current year and previous year
			const currentYear = new Date().getFullYear(); // 2025
			const previousYear = currentYear - 1; // 2024

			console.log(`Attempting to fetch data for years ${previousYear} and ${currentYear}`);

			// IMPORTANT: Use API_ENDPOINTS to ensure fallback URLs
			let currentYearData = null;
			let previousYearData = null;

			// Try current year
			const currentYearParam = studentNummer ?
				`jaar=${currentYear}` :
				`jaar=${currentYear}${studentNummer ? '&student_id=' + studentNummer : ''}`;

			const currentYearUrl = `${API_ENDPOINTS.weeklyData}?${currentYearParam}`;
			console.log(`Fetching current year data from: ${currentYearUrl}`);

			try {
				const currentResponse = await fetch(currentYearUrl, {
					headers: {
						'Accept': 'application/json'
					}
				});

				console.log('Current year response status:', currentResponse.status);

				if (currentResponse.ok) {
					const responseText = await currentResponse.text();
					console.log('Response text sample:', responseText.substring(0, 100) + '...');

					try {
						const apiData = JSON.parse(responseText);
						if (apiData.success && apiData.data) {
							currentYearData = transformApiDataToUiFormat(apiData.data, currentYear);
							console.log('Current year data retrieved successfully');
						} else {
							console.warn('API returned success: false or no data');
						}
					} catch (jsonError) {
						console.error('JSON parse error for current year data:', jsonError);
						console.log('First 100 characters of response:', responseText.substring(0, 100));
					}
				}
			} catch (error) {
				console.error('Error fetching current year data:', error);
			}

			// Try previous year
			const previousYearParam = studentNummer ?
				`jaar=${previousYear}` :
				`jaar=${previousYear}${studentNummer ? '&student_id=' + studentNummer : ''}`;

			const previousYearUrl = `${API_ENDPOINTS.weeklyData}?${previousYearParam}`;
			console.log(`Fetching previous year data from: ${previousYearUrl}`);

			try {
				const previousResponse = await fetch(previousYearUrl, {
					headers: {
						'Accept': 'application/json'
					}
				});

				console.log('Previous year response status:', previousResponse.status);

				if (previousResponse.ok) {
					const responseText = await previousResponse.text();
					console.log('Response text sample:', responseText.substring(0, 100) + '...');

					try {
						const apiData = JSON.parse(responseText);
						if (apiData.success && apiData.data) {
							previousYearData = transformApiDataToUiFormat(apiData.data, previousYear);
							console.log('Previous year data retrieved successfully');
						} else {
							console.warn('API returned success: false or no data');
						}
					} catch (jsonError) {
						console.error('JSON parse error for previous year data:', jsonError);
						console.log('First 100 characters of response:', responseText.substring(0, 100));
					}
				}
			} catch (error) {
				console.error('Error fetching previous year data:', error);
			}

			// Now handle the data
			if (currentYearData && previousYearData) {
				console.log('Data available for both years - combining');
				const combinedData = combineYearData(previousYearData, currentYearData);
				updateStudentData(combinedData);
				return;
			} else if (currentYearData) {
				console.log('Only current year data available');
				updateStudentData(currentYearData);
				return;
			} else if (previousYearData) {
				console.log('Only previous year data available');
				updateStudentData(previousYearData);
				return;
			}
		}

		console.warn('No data found - showing demo data');
		loadDemoData();
	} catch (error) {
		console.error('Error in loadStudentData:', error);
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

// Functie om API data te transformeren naar UI-formaat
function transformApiDataToUiFormat(apiData, year) {
	console.log(`Transforming API data for year ${year}:`, apiData);

	if (!apiData) {
		console.error('Invalid API data');
		return null;
	}

	// Extract student info
	const studentInfo = {
		name: apiData.student?.naam || 'Onbekend',
		number: apiData.student?.studentnummer || 'Onbekend',
		class: apiData.student?.klas || 'Onbekend'
	};

	// Extract weekly data
	const weeks = Array.isArray(apiData.wekelijkse_voortgang) ?
		apiData.wekelijkse_voortgang.map(week => ({
			week_number: parseInt(week.week, 10),
			percentage: parseInt(week.week_percentage, 10),
			minutes_present: parseInt(week.week_aanwezigheid, 10),
			total_minutes: parseInt(week.week_rooster, 10),
			year: year || new Date().getFullYear()
		})) : [];

	// Calculate summary
	let average = 0;
	let bestWeek = null;
	let worstWeek = null;

	if (weeks.length > 0) {
		// Calculate average
		average = Math.round(
			weeks.reduce((sum, week) => sum + week.percentage, 0) / weeks.length
		);

		// Find best and worst weeks
		bestWeek = weeks.reduce((best, current) =>
			current.percentage > best.percentage ? current : best, weeks[0]);

		worstWeek = weeks.reduce((worst, current) =>
			current.percentage < worst.percentage ? current : worst, weeks[0]);
	}

	const summary = {
		average: apiData.eindstatistieken?.eindpercentage || average,
		bestWeek: bestWeek ? {
			week: bestWeek.week_number,
			percentage: bestWeek.percentage
		} : null,
		worstWeek: worstWeek ? {
			week: worstWeek.week_number,
			percentage: worstWeek.percentage
		} : null
	};

	return {
		student: studentInfo,
		summary: summary,
		weeks: weeks,
		year: year
	};
}

// Functie om data van twee jaren te combineren
function combineYearData(previousYearData, currentYearData) {
	console.log('Combining data from previous and current year');

	// Combine weeks from both years
	const combinedWeeks = [
		...previousYearData.weeks,
		...currentYearData.weeks
	];

	// Use the current year's student info
	const studentInfo = currentYearData.student;

	// Calculate new average
	const average = Math.round(
		combinedWeeks.reduce((sum, week) => sum + week.percentage, 0) / combinedWeeks.length
	);

	// Find best and worst weeks across both years
	const bestWeek = combinedWeeks.reduce((best, current) =>
		current.percentage > best.percentage ? current : best, combinedWeeks[0]);

	const worstWeek = combinedWeeks.reduce((worst, current) =>
		current.percentage < worst.percentage ? current : worst, combinedWeeks[0]);

	return {
		student: studentInfo,
		summary: {
			average: average,
			bestWeek: {
				week: bestWeek.week_number,
				percentage: bestWeek.percentage,
				year: bestWeek.year
			},
			worstWeek: {
				week: worstWeek.week_number,
				percentage: worstWeek.percentage,
				year: worstWeek.year
			}
		},
		weeks: combinedWeeks
	};
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

// Debug sectie moet buiten een functie staan
console.log('Student overview script initializing');
console.log('API Endpoints:', {
	studentData: window.studentDataUrl,
	weeklyData: window.weeklyDataUrl
});
console.log('Student number:', window.studentnummer);

// Update je loadStudentData functie (deze moet buiten andere functies staan)
async function loadStudentData(studentId = null, startWeek = 1, endWeek = 52) {
	try {
		showLoadingState(true);
		console.log('Loading student data...');

		// Use the studentnummer from parameters, window object, or null
		const studentNummer = studentId || window.studentnummer || null;
		console.log('Using student number:', studentNummer);

		if (studentNummer) {
			// Get the current year and previous year
			const currentYear = new Date().getFullYear(); // 2025
			const previousYear = currentYear - 1; // 2024

			console.log(`Attempting to fetch data for years ${previousYear} and ${currentYear}`);

			// IMPORTANT: Use API_ENDPOINTS to ensure fallback URLs
			let currentYearData = null;
			let previousYearData = null;

			// Try current year
			const currentYearParam = studentNummer ?
				`jaar=${currentYear}` :
				`jaar=${currentYear}${studentNummer ? '&student_id=' + studentNummer : ''}`;

			const currentYearUrl = `${API_ENDPOINTS.weeklyData}?${currentYearParam}`;
			console.log(`Fetching current year data from: ${currentYearUrl}`);

			try {
				const currentResponse = await fetch(currentYearUrl, {
					headers: {
						'Accept': 'application/json'
					}
				});

				console.log('Current year response status:', currentResponse.status);

				if (currentResponse.ok) {
					const responseText = await currentResponse.text();
					console.log('Response text sample:', responseText.substring(0, 100) + '...');

					try {
						const apiData = JSON.parse(responseText);
						if (apiData.success && apiData.data) {
							currentYearData = transformApiDataToUiFormat(apiData.data, currentYear);
							console.log('Current year data retrieved successfully');
						} else {
							console.warn('API returned success: false or no data');
						}
					} catch (jsonError) {
						console.error('JSON parse error for current year data:', jsonError);
						console.log('First 100 characters of response:', responseText.substring(0, 100));
					}
				}
			} catch (error) {
				console.error('Error fetching current year data:', error);
			}

			// Try previous year
			const previousYearParam = studentNummer ?
				`jaar=${previousYear}` :
				`jaar=${previousYear}${studentNummer ? '&student_id=' + studentNummer : ''}`;

			const previousYearUrl = `${API_ENDPOINTS.weeklyData}?${previousYearParam}`;
			console.log(`Fetching previous year data from: ${previousYearUrl}`);

			try {
				const previousResponse = await fetch(previousYearUrl, {
					headers: {
						'Accept': 'application/json'
					}
				});

				console.log('Previous year response status:', previousResponse.status);

				if (previousResponse.ok) {
					const responseText = await previousResponse.text();
					console.log('Response text sample:', responseText.substring(0, 100) + '...');

					try {
						const apiData = JSON.parse(responseText);
						if (apiData.success && apiData.data) {
							previousYearData = transformApiDataToUiFormat(apiData.data, previousYear);
							console.log('Previous year data retrieved successfully');
						} else {
							console.warn('API returned success: false or no data');
						}
					} catch (jsonError) {
						console.error('JSON parse error for previous year data:', jsonError);
						console.log('First 100 characters of response:', responseText.substring(0, 100));
					}
				}
			} catch (error) {
				console.error('Error fetching previous year data:', error);
			}

			// Now handle the data
			if (currentYearData && previousYearData) {
				console.log('Data available for both years - combining');
				const combinedData = combineYearData(previousYearData, currentYearData);
				updateStudentData(combinedData);
				return;
			} else if (currentYearData) {
				console.log('Only current year data available');
				updateStudentData(currentYearData);
				return;
			} else if (previousYearData) {
				console.log('Only previous year data available');
				updateStudentData(previousYearData);
				return;
			}
		}

		console.warn('No data found - showing demo data');
		loadDemoData();
	} catch (error) {
		console.error('Error in loadStudentData:', error);
		loadDemoData();
	} finally {
		showLoadingState(false);
	}
}

// De functie updateCircleChart is niet compleet
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
		const animatedPercentage = Math.round(currentPercentage + (percentage - currentPercentage) * easeOut);

		percentageText.textContent = `${animatedPercentage}%`;

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
}

// De filterByWeekRange functie is niet correct gesloten
function filterByWeekRange(startWeek, endWeek) {
	console.log(`Filtering weeks from ${startWeek} to ${endWeek}`);

	// Convert to numbers
	startWeek = parseInt(startWeek, 10);
	endWeek = parseInt(endWeek, 10);

	// Filter weeks by range
	const filteredWeeks = currentStudentData.weeklyData.filter(week => {
		return week.week_number >= startWeek && week.week_number <= endWeek;
	});

	// Update the grid with filtered weeks
	updateWeeksGrid(filteredWeeks);
}

// Sluiten van document.addEventListener functie bij regel 793
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

// Voeg deze functie toe om de weeks grid bij te werken
function updateWeeksGrid(weeks) {
	const grid = document.getElementById('weeks-grid');
	if (!grid) {
		console.error('Weeks grid element not found');
		return;
	}

	console.log(`Updating weeks grid with ${weeks ? weeks.length : 0} weeks`);

	// Clear existing content
	grid.innerHTML = '';

	if (!weeks || weeks.length === 0) {
		console.warn('No week data available');
		grid.innerHTML = '<div class="no-data">Geen weekgegevens beschikbaar</div>';
		return;
	}

	// Check if we have weeks from different years
	const uniqueYears = [...new Set(weeks.map(week => week.year))];
	const showYears = uniqueYears.length > 1;

	// Sort by year and then by week
	const sortedWeeks = [...weeks].sort((a, b) => {
		if (a.year !== b.year) {
			return a.year - b.year;
		}
		return a.week_number - b.week_number;
	});

	// Add each week card
	sortedWeeks.forEach((week, index) => {
		const weekCard = document.createElement('div');
		weekCard.className = 'week-card';
		weekCard.dataset.week = week.week_number;
		weekCard.dataset.year = week.year || new Date().getFullYear();

		const weekTitle = document.createElement('div');
		weekTitle.className = 'week-title';

		// Include year if we have multiple years
		if (showYears) {
			weekTitle.textContent = `Week ${week.week_number} (${week.year})`;
		} else {
			weekTitle.textContent = `Week ${week.week_number}`;
		}

		const weekPercentage = document.createElement('div');
		weekPercentage.className = `week-percentage ${getScoreClass(week.percentage)}`;
		weekPercentage.textContent = `${week.percentage}%`;

		weekCard.appendChild(weekTitle);
		weekCard.appendChild(weekPercentage);

		// Optional: Add click handler to show details
		weekCard.addEventListener('click', () => {
			showWeekDetails(week);
		});

		grid.appendChild(weekCard);
	});
}

// Helper functie voor updateWeeksGrid
function getScoreClass(percentage) {
	if (percentage >= 100) return 'perfect';
	if (percentage >= 80) return 'goed';
	if (percentage >= 70) return 'voldoende';
	if (percentage >= 60) return 'onvoldoende';
	return 'kritiek';
}

// Helper functie voor updateSummaryCards
function getStatusText(percentage) {
	if (percentage >= 100) return 'Perfect';
	if (percentage >= 80) return 'Goed';
	if (percentage >= 70) return 'Voldoende';
	if (percentage >= 60) return 'Onvoldoende';
	return 'Kritiek';
}

// Optioneel: Voeg deze functie toe voor het tonen van weekdetails
function showWeekDetails(week) {
	console.log('Week details:', week);
	// Hier kun je een modal of detailweergave implementeren
}

// Helper functie voor number animaties
function animateNumber(element, start, end, duration) {
	if (!element) return;

	const startTime = performance.now();
	const change = end - start;

	function updateNumber(currentTime) {
		const elapsed = currentTime - startTime;
		const progress = Math.min(elapsed / duration, 1);
		const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
		const currentValue = Math.round(start + change * easeProgress);

		element.textContent = `${currentValue}%`;

		if (progress < 1) {
			requestAnimationFrame(updateNumber);
		}
	}

	requestAnimationFrame(updateNumber);
}

function showLoadingState(isLoading) {
	const loadingElement = document.getElementById('loading');
	const contentElement = document.getElementById('content'); // of welke container je ook gebruikt

	if (isLoading) {
		if (loadingElement) loadingElement.style.display = 'block';
		if (contentElement) contentElement.style.display = 'none';

		// Als er geen loading element is, maak er dan eentje
		if (!loadingElement) {
			const loader = document.createElement('div');
			loader.id = 'loading';
			loader.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; color: white;';
			loader.innerHTML = '<div style="text-align: center;"><div class="loader-spinner"></div><p>Gegevens laden...</p></div>';
			document.body.appendChild(loader);
		}
	} else {
		if (loadingElement) loadingElement.style.display = 'none';
		if (contentElement) contentElement.style.display = 'block';
	}
}
function drawLineChart(canvasId, data, options = {}) {
	const canvas = document.getElementById(canvasId);
	if (!canvas) {
		console.error(`Canvas element with id '${canvasId}' not found`);
		return;
	}
	const ctx = canvas.getContext('2d');
	// Basis lijn chart implementatie
	const chart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: data.labels || [],
			datasets: [{
				label: options.label || 'Data',
				data: data.values || [],
				borderColor: options.borderColor || '#3498db',
				backgroundColor: options.backgroundColor || 'rgba(52, 152, 219, 0.1)',
				borderWidth: options.borderWidth || 2,
				fill: options.fill || false
			}]
		},
		options: {
			responsive: true,
			scales: {
				y: {
					beginAtZero: true
				}
			},
			...options.chartOptions
		}
	});
	return chart;
}
function loadDemoData() {
	return new Promise((resolve) => {
		// Simuleer het laden van demo data
		const demoData = {
			students: [
				{
					id: 1,
					name: "Jan Jansen",
					class: "4A",
					grade: 8.5,
					subjects: ["Nederlands", "Wiskunde", "Geschiedenis"]
				},
				{
					id: 2,
					name: "Lisa de Vries",
					class: "4B",
					grade: 7.8,
					subjects: ["Engels", "Biologie", "Scheikunde"]
				},
				{
					id: 3,
					name: "Mark van der Berg",
					class: "4A",
					grade: 9.1,
					subjects: ["Fysica", "Wiskunde", "Informatica"]
				}
			],
			statistics: {
				totalStudents: 3,
				averageGrade: 8.47,
				passRate: 100
			}
		};
		// Simuleer loading tijd
		setTimeout(() => {
			resolve(demoData);
		}, 1000);
	});
}

// With specific student ID
loadStudentData('st112161364');

// Or if studentnummer is already set in window object
loadStudentData();
function calculateFilteredStats(filteredData) {
	if (!filteredData || filteredData.length === 0) {
		return {
			totalStudents: 0,
			averageGrade: 0,
			passRate: 0,
			failRate: 0,
			highestGrade: 0,
			lowestGrade: 0
		};
	}

	const totalStudents = filteredData.length;
	const grades = filteredData.map(student => student.grade || 0);
	// Bereken gemiddelde cijfer
	const averageGrade = grades.reduce((sum, grade) => sum + grade, 0) / totalStudents;
	// Bereken slagingspercentage (>= 5.5)
	const passedStudents = filteredData.filter(student => (student.grade || 0) >= 5.5).length;
	const passRate = (passedStudents / totalStudents) * 100;
	const failRate = 100 - passRate;
	// Hoogste en laagste cijfer
	const highestGrade = Math.max(...grades);
	const lowestGrade = Math.min(...grades);
	return {
		totalStudents,
		averageGrade: Math.round(averageGrade * 100) / 100, // Afronden op 2 decimalen
		passRate: Math.round(passRate * 100) / 100,
		failRate: Math.round(failRate * 100) / 100,
		highestGrade,
		lowestGrade,
		passedStudents,
		failedStudents: totalStudents - passedStudents
	};
}

// API Endpoints beschikbaar bij het laden van de pagina
console.log('API Endpoints available on page load:', {
	studentDataUrl: window.studentDataUrl,
	weeklyDataUrl: window.weeklyDataUrl,
	studentnummer: window.studentnummer
});

function showLoadingState(isLoading) {
	const loadingElement = document.getElementById('loading');
	const contentElement = document.getElementById('content');

	if (isLoading) {
		if (loadingElement) loadingElement.style.display = 'block';
		if (contentElement) contentElement.style.display = 'none';
	} else {
		if (loadingElement) loadingElement.style.display = 'none';
		if (contentElement) contentElement.style.display = 'block';
	}
}

// Fix voor Error: drawLineChart is not defined
function drawLineChart(canvasId, data, options = {}) {
	const canvas = document.getElementById(canvasId);
	if (!canvas) {
		console.error(`Canvas element with id '${canvasId}' not found`);
		return;
	}

	if (typeof Chart === 'undefined') {
		console.error('Chart.js not loaded');
		return;
	}

	const ctx = canvas.getContext('2d');

	const chart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: data.labels || [],
			datasets: [{
				label: options.label || 'Data',
				data: data.values || [],
				borderColor: options.borderColor || '#3498db',
				backgroundColor: options.backgroundColor || 'rgba(52, 152, 219, 0.1)',
				borderWidth: options.borderWidth || 2,
				fill: options.fill || false
			}]
		},
		options: {
			responsive: true,
			scales: {
				y: {
					beginAtZero: true
				}
			},
			...options.chartOptions
		}
	});

	return chart;
}

// Fix voor Error: loadDemoData is not defined
function loadDemoData() {
	return new Promise((resolve) => {
		const demoData = {
			students: [
				{
					id: 1,
					name: "Jan Jansen",
					class: "4A",
					grade: 8.5,
					subjects: ["Nederlands", "Wiskunde", "Geschiedenis"]
				},
				{
					id: 2,
					name: "Lisa de Vries",
					class: "4B",
					grade: 7.8,
					subjects: ["Engels", "Biologie", "Scheikunde"]
				},
				{
					id: 3,
					name: "Mark van der Berg",
					class: "4A",
					grade: 9.1,
					subjects: ["Fysica", "Wiskunde", "Informatica"]
				}
			],
			statistics: {
				totalStudents: 3,
				averageGrade: 8.47,
				passRate: 100
			}
		};

		setTimeout(() => {
			resolve(demoData);
		}, 1000);
	});
}

// Fix voor Error: calculateFilteredStats is not defined
function calculateFilteredStats(filteredData) {
	if (!filteredData || filteredData.length === 0) {
		return {
			totalStudents: 0,
			averageGrade: 0,
			passRate: 0,
			failRate: 0,
			highestGrade: 0,
			lowestGrade: 0
		};
	}

	const totalStudents = filteredData.length;
	const grades = filteredData.map(student => student.grade || 0);

	const averageGrade = grades.reduce((sum, grade) => sum + grade, 0) / totalStudents;
	const passedStudents = filteredData.filter(student => (student.grade || 0) >= 5.5).length;
	const passRate = (passedStudents / totalStudents) * 100;
	const failRate = 100 - passRate;
	const highestGrade = Math.max(...grades);
	const lowestGrade = Math.min(...grades);

	return {
		totalStudents,
		averageGrade: Math.round(averageGrade * 100) / 100,
		passRate: Math.round(passRate * 100) / 100,
		failRate: Math.round(failRate * 100) / 100,
		highestGrade,
		lowestGrade,
		passedStudents,
		failedStudents: totalStudents - passedStudents
	};
}

