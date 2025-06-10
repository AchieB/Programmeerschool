<template>
  <div class="dashboard">
    <!-- Browser Header -->
    <header class="browser-header">
      <div class="browser-controls">
      </div>
      <span class="browser-title">Docent overzicht</span>
      <div class="browser-profile" @click="toggleProfile" :class="{ active: showProfile }">
        <div v-if="showProfile" class="profile-dropdown">
          <div class="profile-item">Profiel</div>
          <div class="profile-item">Instellingen</div>
          <div class="profile-item" @click="logout">Uitloggen</div>
        </div>
      </div>
    </header>

    <main>
      <!-- Filter Panel -->
      <FilterPanel 
        :selectedWeek="selectedWeek"
        :selectedGroup="selectedGroup"
        :selectedStudent="selectedStudent"
        :selectedYear="selectedYear"
        :availableWeeks="availableWeeks"
        :availableGroups="availableGroups"
        :availableYears="availableYears"
        :allStudents="allStudents"
        :showWeekPicker="showWeekPicker"
        @update-week="handleWeekChange"
        @update-group="handleGroupChange"
        @update-student="handleStudentChange"
        @update-year="handleYearChange"
        @filter="applyFilters"
        @reset="resetFilters"
        @go-to-details="goToStudentDetails"
        @toggle-week-picker="showWeekPicker = !showWeekPicker"
      />

      <!-- Statistics Cards -->
      <StatisticsCards 
        :filteredStudents="filteredStudents"
        @show-all-students="showAllStudents"
        @show-average-details="showAverageDetails"
        @show-low-performers="showLowPerformers"
        @show-top-performers="showTopPerformers"
      />

      <!-- Students Table -->
      <StudentsTable 
        :students="paginatedStudents"
        :sortField="sortField"
        :sortOrder="sortOrder"
        :selectedStudent="selectedStudentData"
        :selectedWeek="selectedWeek"
        :selectedYear="selectedYear"
        :allStudents="filteredStudents" 
        :currentPage="currentPage"
        :totalPages="totalPages"
        @sort="handleSort"
        @select-student="selectStudent"
        @edit-student="editStudent"
        @delete-student="deleteStudent"
        @export="exportData"
        @page-change="handlePageChange"
      />

      <!-- Modal -->
      <Modal 
        v-if="showModal"
        :show="showModal"
        :type="modalType"
        :title="modalTitle"
        :students="modalStudents"
        :averageDetails="averageDetails"
        @close="closeModal"
      />
    </main>

    <!-- Footer -->
    <footer class="browser-footer">
      <div class="status-bar">
        <span>{{ filteredStudents.length }} studenten geladen</span>
        <span>Laatste update: {{ lastUpdate }}</span>
        <span>Jaar: {{ selectedYear }}</span>
      </div>
    </footer>
  </div>
</template>

<script>
import WeekOverviewAllStudents from './WeekOverviewAllStudents.vue'
import FilterPanel from '../components/FilterPanel.vue'
import StatisticsCards from '../components/StatisticsCards.vue'
import StudentsTable from '../components/StudentsTable.vue'
import Modal from '../components/Modal.vue'

export default {
  name: "Home",
  
  components: {
    FilterPanel,
    StatisticsCards,
    StudentsTable,
    Modal
  },
  
  data() {
    return {
      // UI State
      showWeekPicker: false,
      showProfile: false,
      showModal: false,
      modalType: '',
      modalTitle: '',
      modalStudents: [],
      
      // Navigation State
      canGoBack: false,
      canGoForward: false,
      
      // Filter State
      selectedWeek: "Week 10",
      selectedGroup: "Alle",
      selectedStudent: "Alle studenten",
      selectedYear: "2025",
      
      // Table State
      selectedStudentData: null,
      sortField: 'name',
      sortOrder: 'asc',
      currentPage: 1,
      itemsPerPage: 10,
      
      // Data
      lastUpdate: new Date().toLocaleTimeString(),
      allStudents: [],
      filteredStudents: [],
      
      // Configuration
      availableWeeks: [
        "Week 48", "Week 49", "Week 50", "Week 51", "Week 52", // Late 2024
        "Week 1", "Week 2", "Week 3", "Week 4", "Week 5",     // Early 2025
        "Week 8", "Week 9", "Week 10", "Week 11", "Week 12", "Week 13" // Regular weeks
      ],
      
      availableGroups: [
        "Groep A", "Groep B", "Groep C", "Groep D"
      ],
      
      availableYears: ["2024", "2025"],
      
      baseStudents: [
        { nr: "1234", name: "Sara", group: "Groep A" },
        { nr: "12345", name: "Saam", group: "Groep A" },
        { nr: "3134", name: "Boo", group: "Groep B" },
        { nr: "9374", name: "Laan", group: "Groep B" },
        { nr: "8903", name: "Saar", group: "Groep C" },
        { nr: "92021", name: "Lana", group: "Groep C" },
        { nr: "5678", name: "Tom", group: "Groep A" },
        { nr: "7890", name: "Emma", group: "Groep D" },
        { nr: "1111", name: "Max", group: "Groep D" },
        { nr: "2222", name: "Lisa", group: "Groep B" },
      ],
      
      // Attendance data for 2024
      attendance2024: {
        "Week 48": {
          "1234": 68, "12345": 52, "3134": 38, "9374": 82, "8903": 28,
          "92021": 89, "5678": 64, "7890": 86, "1111": 32, "2222": 79
        },
        "Week 49": {
          "1234": 71, "12345": 55, "3134": 41, "9374": 85, "8903": 31,
          "92021": 92, "5678": 67, "7890": 89, "1111": 35, "2222": 82
        },
        "Week 50": {
          "1234": 74, "12345": 58, "3134": 44, "9374": 88, "8903": 34,
          "92021": 95, "5678": 70, "7890": 92, "1111": 38, "2222": 85
        },
        "Week 51": {
          "1234": 69, "12345": 54, "3134": 40, "9374": 84, "8903": 30,
          "92021": 91, "5678": 66, "7890": 88, "1111": 34, "2222": 81
        },
        "Week 52": {
          "1234": 72, "12345": 57, "3134": 43, "9374": 87, "8903": 33,
          "92021": 94, "5678": 69, "7890": 91, "1111": 37, "2222": 84
        }
      },
      
      // Attendance data for 2025 (higher percentages)
      attendance2025: {
        "Week 1": {
          "1234": 85, "12345": 72, "3134": 58, "9374": 95, "8903": 48,
          "92021": 98, "5678": 82, "7890": 99, "1111": 52, "2222": 92
        },
        "Week 2": {
          "1234": 88, "12345": 75, "3134": 61, "9374": 97, "8903": 51,
          "92021": 96, "5678": 85, "7890": 100, "1111": 55, "2222": 94
        },
        "Week 3": {
          "1234": 91, "12345": 78, "3134": 64, "9374": 99, "8903": 54,
          "92021": 99, "5678": 88, "7890": 98, "1111": 58, "2222": 96
        },
        "Week 4": {
          "1234": 89, "12345": 76, "3134": 62, "9374": 96, "8903": 52,
          "92021": 97, "5678": 86, "7890": 99, "1111": 56, "2222": 93
        },
        "Week 5": {
          "1234": 92, "12345": 79, "3134": 65, "9374": 98, "8903": 55,
          "92021": 100, "5678": 89, "7890": 97, "1111": 59, "2222": 95
        },
        "Week 8": {
          "1234": 75, "12345": 60, "3134": 45, "9374": 88, "8903": 32,
          "92021": 95, "5678": 70, "7890": 92, "1111": 38, "2222": 85
        },
        "Week 9": {
          "1234": 80, "12345": 65, "3134": 35, "9374": 92, "8903": 48,
          "92021": 88, "5678": 75, "7890": 96, "1111": 42, "2222": 90
        },
        "Week 10": {
          "1234": 83, "12345": 72, "3134": 30, "9374": 90, "8903": 43,
          "92021": 92, "5678": 78, "7890": 95, "1111": 45, "2222": 88
        },
        "Week 11": {
          "1234": 87, "12345": 78, "3134": 28, "9374": 94, "8903": 52,
          "92021": 89, "5678": 82, "7890": 98, "1111": 48, "2222": 91
        },
        "Week 12": {
          "1234": 90, "12345": 85, "3134": 25, "9374": 96, "8903": 55,
          "92021": 85, "5678": 88, "7890": 100, "1111": 52, "2222": 94
        },
        "Week 13": {
          "1234": 92, "12345": 88, "3134": 22, "9374": 98, "8903": 58,
          "92021": 82, "5678": 92, "7890": 97, "1111": 55, "2222": 96
        }
      }
    };
  },
  
  computed: {
    // Get current year's attendance data
    currentYearAttendance() {
      return this.selectedYear === "2024" ? this.attendance2024 : this.attendance2025;
    },
    
    paginatedStudents() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.sortedStudents.slice(start, end);
    },
    
    sortedStudents() {
      return [...this.filteredStudents].sort((a, b) => {
        let aVal = a[this.sortField];
        let bVal = b[this.sortField];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        const comparison = aVal > bVal ? 1 : -1;
        return this.sortOrder === 'asc' ? comparison : -comparison;
      });
    },
    
    totalPages() {
      return Math.ceil(this.filteredStudents.length / this.itemsPerPage);
    },
    
    averageDetails() {
      if (this.filteredStudents.length === 0) {
        return { highest: 0, lowest: 0, median: 0 };
      }
      
      const attendances = this.filteredStudents.map(s => s.attendance);
      const sorted = [...attendances].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      
      return {
        highest: Math.max(...attendances),
        lowest: Math.min(...attendances),
        median: sorted.length % 2 !== 0 
          ? sorted[mid] 
          : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      };
    }
  },
  
  mounted() {
    this.initializeData();
    this.setupEventListeners();
    this.simulateBrowserNavigation();
  },
  
  methods: {
    // Initialization Methods
    initializeData() {
      this.updateStudentsForWeek();
      this.applyFilters();
    },
    
    setupEventListeners() {
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-panel')) {
          this.showWeekPicker = false;
        }
        if (!e.target.closest('.browser-profile')) {
          this.showProfile = false;
        }
      });
    },
    
    simulateBrowserNavigation() {
      setTimeout(() => {
        this.canGoBack = true;
      }, 2000);
    },
    
    // Data Methods
    updateStudentsForWeek() {
      const weekData = this.currentYearAttendance[this.selectedWeek];
      if (!weekData) return;
      
      this.allStudents = this.baseStudents.map(student => ({
        ...student,
        attendance: weekData[student.nr] || 0,
        year: this.selectedYear
      }));
    },
    
    applyFilters() {
      let filtered = [...this.allStudents];
      
      if (this.selectedGroup !== "Alle") {
        filtered = filtered.filter(s => s.group === this.selectedGroup);
      }
      
      if (this.selectedStudent !== "Alle studenten") {
        filtered = filtered.filter(s => s.nr === this.selectedStudent);
      }
      
      this.filteredStudents = filtered;
      this.currentPage = 1;
      this.updateLastUpdate();
    },
    
    resetFilters() {
      this.selectedWeek = "Week 10";
      this.selectedGroup = "Alle";
      this.selectedStudent = "Alle studenten";
      this.selectedYear = "2025";
      this.updateStudentsForWeek();
      this.applyFilters();
    },
    
    updateLastUpdate() {
      this.lastUpdate = new Date().toLocaleTimeString();
    },
    
    // Event Handlers
    handleWeekChange(week) {
      this.selectedWeek = week;
      this.showWeekPicker = false;
      this.updateStudentsForWeek();
      this.applyFilters();
    },
    
    handleGroupChange(group) {
      this.selectedGroup = group;
      this.applyFilters();
    },
    
    handleStudentChange(student) {
      this.selectedStudent = student;
      this.applyFilters();
    },
    
    handleYearChange(year) {
      this.selectedYear = year;
      this.updateStudentsForWeek();
      this.applyFilters();
    },
    
    handleSort(field) {
      if (this.sortField === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortOrder = 'asc';
      }
    },
    
    handlePageChange(page) {
      this.currentPage = page;
    },
    
    // Student Actions
    selectStudent(student) {
      this.selectedStudentData = this.selectedStudentData?.nr === student.nr ? null : student;
    },
    
    editStudent(student) {
      alert(`Bewerken van student: ${student.name} (${student.nr})`);
    },
    
    deleteStudent(student) {
      if (confirm(`Weet je zeker dat je ${student.name} wilt verwijderen?`)) {
        const index = this.allStudents.findIndex(s => s.nr === student.nr);
        if (index > -1) {
          this.allStudents.splice(index, 1);
          this.applyFilters();
        }
      }
    },
    
    // Navigation Methods
    goToStudentDetails() {
      const studentData = this.getSelectedStudentForDetails();
      
      this.$router.push({
        name: 'StudentDetails',
        params: { studentId: studentData.nr }
      });
    },
    
    getSelectedStudentForDetails() {
      if (this.selectedStudent !== "Alle studenten") {
        return this.allStudents.find(s => s.nr === this.selectedStudent);
      }
      
      if (this.filteredStudents.length > 0) {
        return this.filteredStudents[0];
      }
      
      return this.allStudents[0] || { nr: "1234", name: "Sara", group: "Groep A" };
    },
    
    // Modal Methods
    showAllStudents() {
      this.openModal('students', 'Alle Studenten', [...this.filteredStudents]);
    },
    
    showAverageDetails() {
      this.openModal('average', 'Aanwezigheid Details', []);
    },
    
    showLowPerformers() {
      const lowPerformers = this.filteredStudents.filter(s => s.attendance < 50);
      this.openModal('students', 'Studenten met lage aanwezigheid (<50%)', lowPerformers);
    },
    
    showTopPerformers() {
      const topPerformers = this.filteredStudents.filter(s => s.attendance > 85);
      this.openModal('students', 'Top studenten (>85%)', topPerformers);
    },
    
    openModal(type, title, students) {
      this.modalType = type;
      this.modalTitle = title;
      this.modalStudents = students;
      this.showModal = true;
    },
    
    closeModal() {
      this.showModal = false;
    },
    
    // Export Methods
    exportData() {
      const csvContent = this.generateCSVContent();
      this.downloadCSV(csvContent);
    },
    
    generateCSVContent() {
      const headers = 'Student Nr,Naam,Aanwezigheid,Groep,Jaar';
      const rows = this.filteredStudents.map(s => 
        `${s.nr},${s.name},${s.attendance}%,${s.group},${s.year || this.selectedYear}`
      );
      
      return [headers, ...rows].join('\n');
    },
    
    downloadCSV(csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      a.href = url;
      a.download = `studenten_${this.selectedYear}_${this.selectedWeek.replace(' ', '_')}.csv`;
      a.click();
      
      window.URL.revokeObjectURL(url);
    },
  }
};
</script>

<style src="../styles/dashboard.css"></style>