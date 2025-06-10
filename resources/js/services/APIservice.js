import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
	baseURL: '/api', // Relative path assuming frontend and backend are served from same domain
	headers: {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'X-Requested-With': 'XMLHttpRequest'
	}
});

// Add CSRF token to every request if you use Laravel's CSRF protection
api.interceptors.request.use(config => {
	const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
	if (token) {
		config.headers['X-CSRF-TOKEN'] = token;
	}
	return config;
});

export const importService = {
	// Upload AAR file
	uploadFile(formData) {
		return api.post('/import/upload', formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		});
	},

	// Get import history
	getImportLogs() {
		return api.get('/import/logs');
	},

	// Get student attendance data
	getStudentAttendance(studentId) {
		return api.get(`/students/${studentId}/attendance`);
	},

	// Get weekly overview
	getWeeklyOverview(week, year) {
		return api.get(`/attendance/weekly?week=${week}&year=${year}`);
	}
};

export default api;