<template>
  <div class="dashboard">
    <header class="browser-header">
      <div class="browser-controls">
        <button @click="goBack" :disabled="!canGoBack">&larr;</button>
        <button @click="goForward" :disabled="!canGoForward">&rarr;</button>
        <button @click="closePage">&#10006;</button>
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
      <section class="filter-panel">
        <div>
          <label>
            date
            <input
              type="text"
              v-model="selectedWeek"
              class="input-compact"
              @click="showWeekPicker = !showWeekPicker"
              readonly
            />
            <span class="calendar-icon" title="Kalender" @click="showWeekPicker = !showWeekPicker">&#128197;</span>
            <div v-if="showWeekPicker" class="dropdown-menu week-picker">
              <div 
                v-for="week in availableWeeks" 
                :key="week"
                @click="selectWeek(week)"
                class="dropdown-item"
                :class="{ active: selectedWeek === week }"
              >
                {{ week }}
              </div>
            </div>
          </label>
        </div>
        <div>
          <label>
            Groep
            <select v-model="selectedGroup" class="input-compact" @change="applyFilters">
              <option value="Alle">Alle</option>
              <option v-for="group in availableGroups" :key="group" :value="group">{{ group }}</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            student
            <select v-model="selectedStudent" class="input-compact" @change="applyFilters">
              <option value="Alle studenten">Alle studenten</option>
              <option v-for="student in allStudents" :key="student.nr" :value="student.nr">{{ student.name }}</option>
            </select>
          </label>
        </div>
        <button class="filter-btn details-btn" @click="goToStudentDetails">
          <span class="btn-icon">👤</span>
          Student Details
        </button>
        <button class="filter-btn" @click="applyFilters">Filteren</button>
        <button class="reset-btn" @click="resetFilters">Reset</button>
      </section>
      
      <section class="info-cards">
        <div class="info-card" @click="showAllStudents">
          <div>Aantal studenten</div>
          <div class="info-main">{{ filteredStudents.length }}</div>
        </div>
        <div class="info-card" @click="showAverageDetails">
          <div>Gemiddelde aanwezigheid</div>
          <div class="info-main">{{ avgAttendance }}%</div>
        </div>
        <div class="info-card danger" @click="showLowPerformers">
          <div>Aantal 0 studenten</div>
          <div class="info-main">
            {{ zeroStudents }}
            <div class="info-sub">&lt;50%</div>
          </div>
        </div>
        <div class="info-card success" @click="showTopPerformers">
          <div>Aantal top studenten</div>
          <div class="info-main">
            {{ topStudents }}
            <div class="info-sub">&gt;85%</div>
          </div>
        </div>
      </section>

      <!-- Modal voor details -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>{{ modalTitle }}</h3>
            <button @click="closeModal" class="close-btn">×</button>
          </div>
          <div class="modal-content">
            <div v-if="modalType === 'students'" class="student-list">
              <div v-for="student in modalStudents" :key="student.nr" class="student-item">
                <span>{{ student.name }} ({{ student.nr }})</span>
                <span class="attendance-badge" :class="getAttendanceClass(student.attendance)">
                  {{ student.attendance }}%
                </span>
              </div>
            </div>
            <div v-else-if="modalType === 'average'" class="average-details">
              <div class="stat-row">
                <span>Hoogste aanwezigheid:</span>
                <span>{{ highestAttendance }}%</span>
              </div>
              <div class="stat-row">
                <span>Laagste aanwezigheid:</span>
                <span>{{ lowestAttendance }}%</span>
              </div>
              <div class="stat-row">
                <span>Mediaan:</span>
                <span>{{ medianAttendance }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section class="students-table-section">
        <div class="table-header">
          <h3>Studenten Overzicht</h3>
          <div class="table-actions">
            <button @click="sortBy('name')" class="sort-btn" :class="{ active: sortField === 'name' }">
              Naam {{ sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </button>
            <button @click="sortBy('attendance')" class="sort-btn" :class="{ active: sortField === 'attendance' }">
              Aanwezigheid {{ sortField === 'attendance' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </button>
            <button @click="exportData" class="export-btn">Export</button>
          </div>
        </div>
        <table class="students-table">
          <thead>
            <tr>
              <th @click="sortBy('nr')" class="sortable">
                Student nr: {{ sortField === 'nr' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th @click="sortBy('name')" class="sortable">
                Naam {{ sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th @click="sortBy('attendance')" class="sortable">
                Gem. {{ sortField === 'attendance' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in paginatedStudents" :key="student.nr" @click="selectStudent(student)" :class="{ selected: selectedStudentData?.nr === student.nr }">
              <td>{{ student.nr }}</td>
              <td>{{ student.name }}</td>
              <td>
                <span
                  class="att-percentage"
                  :class="{
                    'att-green': student.attendance >= 85,
                    'att-yellow': student.attendance >= 50 && student.attendance < 85,
                    'att-red': student.attendance < 50
                  }"
                >
                  {{ student.attendance }}%
                </span>
              </td>
              <td>
                <button @click.stop="editStudent(student)" class="action-btn edit">Edit</button>
                <button @click.stop="deleteStudent(student)" class="action-btn delete">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button @click="currentPage = 1" :disabled="currentPage === 1" class="page-btn">First</button>
          <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">Prev</button>
          <span class="page-info">{{ currentPage }} van {{ totalPages }}</span>
          <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-btn">Next</button>
          <button @click="currentPage = totalPages" :disabled="currentPage === totalPages" class="page-btn">Last</button>
        </div>
      </section>
    </main>
    
    <footer class="browser-footer">
      <div class="status-bar">
        <span>{{ filteredStudents.length }} studenten geladen</span>
        <span>Laatste update: {{ lastUpdate }}</span>
      </div>
    </footer>
  </div>
</template>

<script>
import WeekOverviewAllStudents from './WeekOverviewAllStudents.vue'
export default {
  name: "Home",
  data() {
    return {
      selectedWeek: "Week 10",
      selectedGroup: "Alle",
      selectedStudent: "Alle studenten",
      showWeekPicker: false,
      showProfile: false,
      showModal: false,
      modalType: '',
      modalTitle: '',
      modalStudents: [],
      canGoBack: false,
      canGoForward: false,
      selectedStudentData: null,
      sortField: 'name',
      sortOrder: 'asc',
      currentPage: 1,
      itemsPerPage: 10,
      lastUpdate: new Date().toLocaleTimeString(),
      
      availableWeeks: [
        "Week 8", "Week 9", "Week 10", "Week 11", "Week 12", "Week 13"
      ],
      
      availableGroups: [
        "Groep A", "Groep B", "Groep C", "Groep D"
      ],
      
      // Base student data zonder attendance percentages
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
      
      // Attendance data per week
      weeklyAttendance: {
        "Week 8": {
          "1234": 75,    // Sara
          "12345": 60,   // Saam
          "3134": 45,    // Boo
          "9374": 88,    // Laan
          "8903": 32,    // Saar
          "92021": 95,   // Lana
          "5678": 70,    // Tom
          "7890": 92,    // Emma
          "1111": 38,    // Max
          "2222": 85     // Lisa
        },
        "Week 9": {
          "1234": 80,    // Sara
          "12345": 65,   // Saam
          "3134": 35,    // Boo
          "9374": 92,    // Laan
          "8903": 48,    // Saar
          "92021": 88,   // Lana
          "5678": 75,    // Tom
          "7890": 96,    // Emma
          "1111": 42,    // Max
          "2222": 90     // Lisa
        },
        "Week 10": {
          "1234": 83,    // Sara
          "12345": 72,   // Saam
          "3134": 30,    // Boo
          "9374": 90,    // Laan
          "8903": 43,    // Saar
          "92021": 92,   // Lana
          "5678": 78,    // Tom
          "7890": 95,    // Emma
          "1111": 45,    // Max
          "2222": 88     // Lisa
        },
        "Week 11": {
          "1234": 87,    // Sara
          "12345": 78,   // Saam
          "3134": 28,    // Boo
          "9374": 94,    // Laan
          "8903": 52,    // Saar
          "92021": 89,   // Lana
          "5678": 82,    // Tom
          "7890": 98,    // Emma
          "1111": 48,    // Max
          "2222": 91     // Lisa
        },
        "Week 12": {
          "1234": 90,    // Sara
          "12345": 85,   // Saam
          "3134": 25,    // Boo
          "9374": 96,    // Laan
          "8903": 55,    // Saar
          "92021": 85,   // Lana
          "5678": 88,    // Tom
          "7890": 100,   // Emma
          "1111": 52,    // Max
          "2222": 94     // Lisa
        },
        "Week 13": {
          "1234": 92,    // Sara
          "12345": 88,   // Saam
          "3134": 22,    // Boo
          "9374": 98,    // Laan
          "8903": 58,    // Saar
          "92021": 82,   // Lana
          "5678": 92,    // Tom
          "7890": 97,    // Emma
          "1111": 55,    // Max
          "2222": 96     // Lisa
        }
      },
      
      allStudents: [],
      filteredStudents: []
    };
  },
  
  mounted() {
    this.updateStudentsForWeek();
    this.applyFilters();
    
    // Simulate browser navigation
    setTimeout(() => {
      this.canGoBack = true;
    }, 2000);
    
    // Event listeners for closing dropdowns
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.filter-panel')) {
        this.showWeekPicker = false;
      }
      if (!e.target.closest('.browser-profile')) {
        this.showProfile = false;
      }
    });
  },
  
  computed: {
    avgAttendance() {
      if (this.filteredStudents.length === 0) return 0;
      const sum = this.filteredStudents.reduce((acc, s) => acc + s.attendance, 0);
      return Math.round(sum / this.filteredStudents.length);
    },
    
    zeroStudents() {
      return this.filteredStudents.filter((s) => s.attendance < 50).length;
    },
    
    topStudents() {
      return this.filteredStudents.filter((s) => s.attendance > 85).length;
    },
    
    sortedStudents() {
      const sorted = [...this.filteredStudents].sort((a, b) => {
        let aVal = a[this.sortField];
        let bVal = b[this.sortField];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (this.sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
      return sorted;
    },
    
    paginatedStudents() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.sortedStudents.slice(start, end);
    },
    
    totalPages() {
      return Math.ceil(this.filteredStudents.length / this.itemsPerPage);
    },
    
    highestAttendance() {
      return Math.max(...this.filteredStudents.map(s => s.attendance));
    },
    
    lowestAttendance() {
      return Math.min(...this.filteredStudents.map(s => s.attendance));
    },
    
    medianAttendance() {
      const sorted = [...this.filteredStudents].sort((a, b) => a.attendance - b.attendance);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid].attendance : Math.round((sorted[mid - 1].attendance + sorted[mid].attendance) / 2);
    }
  },
  
  methods: {
    updateStudentsForWeek() {
      const weekData = this.weeklyAttendance[this.selectedWeek];
      this.allStudents = this.baseStudents.map(student => ({
        ...student,
        attendance: weekData[student.nr] || 0
      }));
    },
    
    selectWeek(week) {
      this.selectedWeek = week;
      this.showWeekPicker = false;
      this.updateStudentsForWeek(); // Update attendance data voor de nieuwe week
      this.applyFilters();
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
      this.lastUpdate = new Date().toLocaleTimeString();
    },
    
    resetFilters() {
      this.selectedWeek = "Week 10";
      this.selectedGroup = "Alle";
      this.selectedStudent = "Alle studenten";
      this.updateStudentsForWeek(); // Update attendance data
      this.applyFilters();
    },
    
    // Aangepaste methode voor Student Details navigatie via Vue Router
    goToStudentDetails() {
      let studentData = null;
      if (this.selectedStudent !== "Alle studenten") {
        studentData = this.allStudents.find(s => s.nr === this.selectedStudent);
      } else if (this.filteredStudents.length > 0) {
        studentData = this.filteredStudents[0];
      } else {
        studentData = this.allStudents[0] || { nr: "1234", name: "Sara", group: "Groep A" };
      }

      // Navigeer naar de student details pagina via router!
      this.$router.push({
        name: 'StudentDetails',
        params: { studentId: studentData.nr }
      });
    },
    
    sortBy(field) {
      if (this.sortField === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortOrder = 'asc';
      }
    },
    
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
    
    showAllStudents() {
      this.modalType = 'students';
      this.modalTitle = 'Alle Studenten';
      this.modalStudents = [...this.filteredStudents];
      this.showModal = true;
    },
    
    showAverageDetails() {
      this.modalType = 'average';
      this.modalTitle = 'Aanwezigheid Details';
      this.showModal = true;
    },
    
    showLowPerformers() {
      this.modalType = 'students';
      this.modalTitle = 'Studenten met lage aanwezigheid (<50%)';
      this.modalStudents = this.filteredStudents.filter(s => s.attendance < 50);
      this.showModal = true;
    },
    
    showTopPerformers() {
      this.modalType = 'students';
      this.modalTitle = 'Top studenten (>85%)';
      this.modalStudents = this.filteredStudents.filter(s => s.attendance > 85);
      this.showModal = true;
    },
    
    closeModal() {
      this.showModal = false;
    },
    
    getAttendanceClass(attendance) {
      if (attendance >= 85) return 'att-green';
      if (attendance >= 50) return 'att-yellow';
      return 'att-red';
    },
    
    exportData() {
      const csvContent = [
        'Student Nr,Naam,Aanwezigheid,Groep',
        ...this.filteredStudents.map(s => `${s.nr},${s.name},${s.attendance}%,${s.group}`)
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studenten_${this.selectedWeek.replace(' ', '_')}.csv`;
      a.click();
    },
    
    goBack() {
      if (this.canGoBack) {
        alert('Navigatie terug');
        this.canGoForward = true;
      }
    },
    
    goForward() {
      if (this.canGoForward) {
        alert('Navigatie vooruit');
      }
    },
    
    closePage() {
      if (confirm('Weet je zeker dat je de pagina wilt sluiten?')) {
        alert('Pagina wordt gesloten...');
      }
    },
    
    toggleProfile() {
      this.showProfile = !this.showProfile;
    },
    
    logout() {
      if (confirm('Weet je zeker dat je wilt uitloggen?')) {
        alert('Uitloggen...');
        this.showProfile = false;
      }
    }
  }
};
</script>

<style src="./dashboard.css"></style>