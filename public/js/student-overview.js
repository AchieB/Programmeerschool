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

// Debug at start of file to check variables
console.log('Student overview script initializing');
console.log('API Endpoints:', {
	studentData: window.studentDataUrl,
	weeklyData: window.weeklyDataUrl
});
console.log('Student number:', window.studentnummer);

// Update your loadStudentData function
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

			// IMPORTANT: Use window.weeklyDataUrl directly, not through API_ENDPOINTS
			// Fetch data for both years
			let currentYearData = null;
			let previousYearData = null;

			// Try current year
			const currentYearParam = new URLSearchParams({ jaar: currentYear }).toString();
			const currentYearUrl = `${window.weeklyDataUrl}?${currentYearParam}`;
			console.log(`Fetching current year data from: ${currentYearUrl}`);

			try {
				const currentResponse = await fetch(currentYearUrl, {
					headers: {
						'Accept': 'application/json'
					}
				});

				console.log('Current year response status:', currentResponse.status);

				if (currentResponse.ok) {
					const apiData = await currentResponse.json();
					if (apiData.success && apiData.data) {
						currentYearData = transformApiDataToUiFormat(apiData.data, currentYear);
						console.log('Current year data retrieved successfully');
					}
				}
			} catch (error) {
				console.error('Error fetching current year data:', error);
			}

			// Try previous year
			const previousYearParam = new URLSearchParams({ jaar: previousYear }).toString();
			const previousYearUrl = `${window.weeklyDataUrl}?${previousYearParam}`;
			console.log(`Fetching previous year data from: ${previousYearUrl}`);

			try {
				const previousResponse = await fetch(previousYearUrl, {
					headers: {
						'Accept': 'application/json'
					}
				});

				console.log('Previous year response status:', previousResponse.status);

				if (previousResponse.ok) {
					const apiData = await previousResponse.json();
					if (apiData.success && apiData.data) {
						previousYearData = transformApiDataToUiFormat(apiData.data, previousYear);
						console.log('Previous year data retrieved successfully');
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

// Make sure your transformApiDataToUiFormat function assigns the year
function transformApiDataToUiFormat(apiData, year) {
	console.log(`Transforming API data for year ${year}`);

	// Extract weekly data with year information
	const weeks = apiData.wekelijkse_voortgang.map(week => ({
		week_number: week.week,
		year: year, // Add year information
		percentage: week.week_percentage,
		minutes_present: week.week_aanwezigheid,
		total_minutes: week.week_rooster
	}));

	// Find best and worst weeks
	const bestWeek = weeks.reduce((best, current) =>
		current.percentage > best.percentage ? current : best, weeks[0]);

	const worstWeek = weeks.reduce((worst, current) =>
		current.percentage < worst.percentage ? current : worst, weeks[0]);

	return {
		student: {
			name: apiData.student.naam,
			number: apiData.student.studentnummer,
			class: apiData.student.klas || ''
		},
		summary: {
			average: apiData.eindstatistieken.eindpercentage,
			bestWeek: {
				week: bestWeek.week_number,
				year: bestWeek.year,
				percentage: bestWeek.percentage
			},
			worstWeek: {
				week: worstWeek.week_number,
				year: worstWeek.year,
				percentage: worstWeek.percentage
			}
		},
		weeks: weeks,
		year: year
	};
}

// Function to combine data from both years
function combineYearData(previousYearData, currentYearData) {
	console.log('Combining data from both years');

	// Combine weeks from both years
	const combinedWeeks = [
		...previousYearData.weeks,
		...currentYearData.weeks
	];

	// Calculate total minutes for the combined average
	const totalMinutesPresent = combinedWeeks.reduce((sum, week) => sum + week.minutes_present, 0);
	const totalMinutesScheduled = combinedWeeks.reduce((sum, week) => sum + week.total_minutes, 0);
	const combinedPercentage = totalMinutesScheduled > 0
		? Math.round((totalMinutesPresent / totalMinutesScheduled) * 100)
		: 0;

	// Find the best and worst weeks across both years
	const bestWeek = combinedWeeks.reduce((best, current) =>
		current.percentage > best.percentage ? current : best, combinedWeeks[0]);

	const worstWeek = combinedWeeks.reduce((worst, current) =>
		current.percentage < worst.percentage ? current : worst, combinedWeeks[0]);

	return {
		student: currentYearData.student,
		summary: {
			average: combinedPercentage,
			bestWeek: {
				week: bestWeek.week_number,
				year: bestWeek.year,
				percentage: bestWeek.percentage
			},
			worstWeek: {
				week: worstWeek.week_number,
				year: worstWeek.year,
				percentage: worstWeek.percentage
			}
		},
		weeks: combinedWeeks,
		combinedYears: true
	};
}

// Update the updateWeeksGrid function to handle years in display
function updateWeeksGrid(weeks) {
	const grid = document.getElementById('weeks-grid');
	if (!grid) {
		console.error('Weeks grid element not found');
		return;
	}

	console.log('Updating weeks grid with', weeks.length, 'weeks');

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
		weekCard.style.opacity = '0';
		weekCard.style.transform = 'translateY(20px)';

		// Add data attributes for filtering
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
		grid.appendChild(weekCard);

		// Animate in with a slight delay for each card
		setTimeout(() => {
			weekCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
			weekCard.style.opacity = '1';
			weekCard.style.transform = 'translateY(0)';
		}, index * 50);
	});
}

// Modified to return data instead of updating UI directly
async function tryLoadDataForYear(studentNummer, year, updateUI = true) {
	const yearParam = new URLSearchParams({ jaar: year }).toString();
	const weeklyUrl = `${API_ENDPOINTS.weeklyData}?${yearParam}`;

	console.log(`Trying to fetch data for year ${year} from:`, weeklyUrl);

	try {
		const response = await fetch(weeklyUrl, {
			headers: {
				'Accept': 'application/json',
				'X-Requested-With': 'XMLHttpRequest'
			}
		});

		console.log(`Response status for year ${year}:`, response.status);

		if (response.ok) {
			const apiData = await response.json();
			console.log(`API response for year ${year}:`, apiData);

			if (apiData.success && apiData.data) {
				const transformedData = transformApiDataToUiFormat(apiData.data, year);
				console.log(`Transformed data for year ${year}:`, transformedData);

				// If updateUI is true, update the UI directly
				if (updateUI) {
					updateStudentData(transformedData);
					return true;
				}

				// Otherwise return the transformed data
				return transformedData;
			}
		} else {
			console.error(`API response for year ${year} not OK: ${response.status}`);
			try {
				const errorText = await response.text();
				console.error(`Error response: ${errorText}`);
			} catch (e) {
				console.error('Could not read error response');
			}
		}
	} catch (err) {
		console.error(`Error fetching data for year ${year}:`, err);
	}

	return updateUI ? false : null;
}

// New function to combine data from two years
function combineYearData(data2024, data2025) {
	// If we're missing data for one year, return the data we have
	if (!data2024) return data2025;
	if (!data2025) return data2024;

	// Combine the weeks from both years
	const combinedWeeks = [
		...data2024.weeks,
		...data2025.weeks
	];

	// Calculate the combined average
	const totalMinutesPresent = combinedWeeks.reduce((sum, week) => sum + week.minutes_present, 0);
	const totalScheduledMinutes = combinedWeeks.reduce((sum, week) => sum + week.total_minutes, 0);
	const combinedAverage = totalScheduledMinutes > 0
		? Math.round((totalMinutesPresent / totalScheduledMinutes) * 100)
		: 0;

	// Find the best and worst weeks across both years
	const bestWeek = combinedWeeks.reduce((best, current) =>
		current.percentage > best.percentage ? current : best, combinedWeeks[0]);

	const worstWeek = combinedWeeks.reduce((worst, current) =>
		current.percentage < worst.percentage ? current : worst, combinedWeeks[0]);

	// Use the most recent student data
	const student = data2025.student || data2024.student;

	return {
		student: student,
		summary: {
			average: combinedAverage,
			bestWeek: {
				week: bestWeek.week_number,
				year: bestWeek.year,
				percentage: bestWeek.percentage
			},
			worstWeek: {
				week: worstWeek.week_number,
				year: worstWeek.year,
				percentage: worstWeek.percentage
			}
		},
		weeks: combinedWeeks,
		year: `${data2024.year}-${data2025.year}` // Indicate this is combined data
	};
}

// Update the updateWeeksGrid function to show year information
function updateWeeksGrid(weeks) {
	const grid = document.getElementById('weeks-grid');
	if (!grid) return;

	// Clear existing content
	grid.innerHTML = '';

	// Check if we need to show year information (if weeks are from different years)
	const hasMultipleYears = weeks.some(w => w.year !== weeks[0].year);

	// Sort weeks by year and then by week number
	const sortedWeeks = [...weeks].sort((a, b) => {
		if (a.year !== b.year) {
			return a.year - b.year;
		}
		return a.week_number - b.week_number;
	});

	// Add week cards
	sortedWeeks.forEach((week, index) => {
		const weekCard = document.createElement('div');
		weekCard.className = 'week-card';
		weekCard.style.opacity = '0';
		weekCard.style.transform = 'translateY(20px)';

		const weekTitle = document.createElement('div');
		weekTitle.className = 'week-title';

		// Include year in title if we have multiple years
		if (hasMultipleYears) {
			weekTitle.textContent = `Week ${week.week_number} (${week.year})`;
		} else {
			weekTitle.textContent = `Week ${week.week_number}`;
		}

		const weekPercentage = document.createElement('div');
		weekPercentage.className = `week-percentage ${getScoreClass(week.percentage)}`;
		weekPercentage.textContent = `${week.percentage}%`;

		weekCard.appendChild(weekTitle);
		weekCard.appendChild(weekPercentage);
		grid.appendChild(weekCard);

		// Animate in with a slight delay for each card
		setTimeout(() => {
			weekCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
			weekCard.style.opacity = '1';
			weekCard.style.transform = 'translateY(0)';
		}, index * 50);
	});
}

// Add this function to update the student data in the UI
function updateStudentData(data) {
	console.log('Updating student data with:', data);

	if (!data) {
		console.error('No data provided to updateStudentData');
		return;
	}

	// Update current student data object
	currentStudentData = {
		studentInfo: data.student,
		weeklyData: data.weeks,
		summary: data.summary,
		originalSummary: data.summary // Store original for filtering restoration
	};

	// Update UI components
	updateStudentInfo(data.student);
	updateSummaryCards(data.summary);
	updateWeeksGrid(data.weeks);

	console.log('Updated currentStudentData:', currentStudentData);
}

// Add this function to update the student info section
function updateStudentInfo(student) {
	const studentInfoSection = document.querySelector('.student-info');
	if (!studentInfoSection) return;

	studentInfoSection.innerHTML = `
        <div class="student-field"><strong>Student Naam:</strong> ${student.name || ''}</div>
        <div class="student-field"><strong>Student nr:</strong> ${student.number || ''}</div>
        <div class="student-field"><strong>Student Klas:</strong> ${student.class || ''}</div>
    `;
}

// Add this function to update the summary cards
function updateSummaryCards(summary) {
	console.log('Updating summary cards with:', summary);

	if (!summary) {
		console.error('No summary data provided to updateSummaryCards');
		return;
	}

	// Update average percentage
	const averageElement = document.getElementById('average');
	if (averageElement) {
		averageElement.textContent = `${summary.average}%`;
		averageElement.className = `value ${getScoreClass(summary.average)}`;
	}

	// Update status
	const statusElement = document.getElementById('status');
	if (statusElement) {
		const status = getStatusText(summary.average);
		statusElement.textContent = status;
		statusElement.className = `value ${getScoreClass(summary.average)}`;
	}

	// Update best week
	const bestWeekElement = document.getElementById('best-week');
	if (bestWeekElement && summary.bestWeek) {
		if (summary.bestWeek.year) {
			bestWeekElement.textContent = `Week ${summary.bestWeek.week} (${summary.bestWeek.year})`;
		} else {
			bestWeekElement.textContent = `Week ${summary.bestWeek.week}`;
		}
		bestWeekElement.className = `value ${getScoreClass(summary.bestWeek.percentage)}`;
	}

	// Update worst week
	const worstWeekElement = document.getElementById('worst-week');
	if (worstWeekElement && summary.worstWeek) {
		if (summary.worstWeek.year) {
			worstWeekElement.textContent = `Week ${summary.worstWeek.week} (${summary.worstWeek.year})`;
		} else {
			worstWeekElement.textContent = `Week ${summary.worstWeek.week}`;
		}
		worstWeekElement.className = `value ${getScoreClass(summary.worstWeek.percentage)}`;
	}

	console.log('Summary cards updated in DOM');
}

// Helper function to get score class based on percentage
function getScoreClass(percentage) {
	if (percentage >= 80) return 'goed';
	if (percentage >= 70) return 'voldoende';
	if (percentage >= 60) return 'onvoldoende';
	return 'kritiek';
}

// Helper function to get status text based on percentage
function getStatusText(percentage) {
	if (percentage >= 80) return 'Goed';
	if (percentage >= 70) return 'Voldoende';
	if (percentage >= 60) return 'Onvoldoende';
	return 'Kritiek';
}

// Helper function to show/hide loading state
function showLoadingState(isLoading) {
	const container = document.querySelector('.container');
	if (!container) return;

	if (isLoading) {
		container.classList.add('loading');
	} else {
		container.classList.remove('loading');
	}
}

// Add DOMContentLoaded event listener to initialize everything
document.addEventListener('DOMContentLoaded', function () {
	console.log('DOM loaded, initializing student overview');

	// Set up filter button
	const filterBtn = document.getElementById('filter-btn');
	if (filterBtn) {
		filterBtn.addEventListener('click', function () {
			const startWeek = document.getElementById('start-week').value;
			const endWeek = document.getElementById('end-week').value;

			filterByWeekRange(startWeek, endWeek);
		});
	}

	// Load student data
	loadStudentData();
});

// Function to filter by week range
function filterByWeekRange(startWeek, endWeek) {
	if (!currentStudentData || !currentStudentData.weeklyData) {
		console.warn('No weekly data available to filter');
		return;
	}

	// Convert to numbers
	startWeek = parseInt(startWeek, 10);
	endWeek = parseInt(endWeek, 10);

	console.log(`Filtering weeks from ${startWeek} to ${endWeek}`);

	// Filter weeks by range
	const filteredWeeks = currentStudentData.weeklyData.filter(week => {
		return week.week_number >= startWeek && week.week_number <= endWeek;
	});

	// Update the grid with filtered weeks
	updateWeeksGrid(filteredWeeks);
}

// Initialize filter button
document.addEventListener('DOMContentLoaded', function () {
	// Set up filter button
	const filterBtn = document.getElementById('filter-btn');
	if (filterBtn) {
		filterBtn.addEventListener('click', function () {
			const startWeek = document.getElementById('start-week').value;
			const endWeek = document.getElementById('end-week').value;

			filterByWeekRange(startWeek, endWeek);
		});
	}

	// Load student data
	loadStudentData();
});