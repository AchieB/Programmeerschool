<template>
  <div class="week-overview">
    <header class="browser-header">
      <div class="browser-controls">
        <button @click="goBack" :disabled="!canGoBack">&larr;</button>
        <button @click="goForward" :disabled="!canGoForward">&rarr;</button>
        <button @click="closePage">&#10006;</button>
      </div>
      <span class="browser-title">Week {{ selectedWeek }} - Aanwezigheid Overzicht</span>
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
            Week
            <select v-model="selectedWeek" class="input-compact" @change="updateWeekData">
              <option v-for="week in availableWeeks" :key="week" :value="week">Week {{ week }}</option>
            </select>
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
        <button class="filter-btn" @click="applyFilters">Filteren</button>
        <button class="reset-btn" @click="resetFilters">Reset</button>
      </section>
      
      <section class="info-cards">
        <div class="info-card">
          <div>Totaal studenten</div>
          <div class="info-main">{{ filteredWeekData.length }}</div>
        </div>
        <div class="info-card success">
          <div>Aanwezig</div>
          <div class="info-main">
            {{ presentCount }}
            <div class="info-sub">{{ presentPercentage }}%</div>
          </div>
        </div>
        <div class="info-card danger">
          <div>Afwezig</div>
          <div class="info-main">
            {{ absentCount }}
            <div class="info-sub">{{ absentPercentage }}%</div>
          </div>
        </div>
        <div class="info-card warning">
          <div>Te laat</div>
          <div class="info-main">
            {{ lateCount }}
            <div class="info-sub">{{ latePercentage }}%</div>
          </div>
        </div>
      </section>

      <section class="students-table-section">
        <div class="table-header">
          <h3>Aanwezigheid Week {{ selectedWeek }}</h3>
          <div class="table-actions">
            <button @click="sortBy('name')" class="sort-btn" :class="{ active: sortField === 'name' }">
              Naam {{ sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </button>
            <button @click="sortBy('status')" class="sort-btn" :class="{ active: sortField === 'status' }">
              Status {{ sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </button>
            <button @click="exportWeekData" class="export-btn">Export</button>
          </div>
        </div>
        
        <table class="students-table">
          <thead>
            <tr>
              <th @click="sortBy('nr')" class="sortable">
                Student nr {{ sortField === 'nr' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th @click="sortBy('name')" class="sortable">
                Naam {{ sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th>Groep</th>
              <th @click="sortBy('status')" class="sortable">
                Status {{ sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th>Tijd</th>
              <th>Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in paginatedStudents" :key="student.nr" 
                :class="{ 
                  selected: selectedStudentData?.nr === student.nr,
                  'status-present': student.status === 'Aanwezig',
                  'status-absent': student.status === 'Afwezig', 
                  'status-late': student.status === 'Te laat'
                }"
                @click="selectStudent(student)">
              <td>{{ student.nr }}</td>
              <td>{{ student.name }}</td>
              <td>{{ student.group }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(student.status)">
                  {{ student.status }}
                </span>
              </td>
              <td>{{ student.time || '-' }}</td>
              <td>{{ student.notes || '-' }}</td>
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
        <span>{{ filteredWeekData.length }} studenten geladen voor Week {{ selectedWeek }}</span>
        <span>Laatste update: {{ lastUpdate }}</span>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: "WeekOverviewAllStudents",
  data() {
    return {
      selectedWeek: 8,
      selectedGroup: "Alle",
      showProfile: false,
      canGoBack: true,
      canGoForward: false,
      selectedStudentData: null,
      sortField: 'name',
      sortOrder: 'asc',
      currentPage: 1,
      itemsPerPage: 15,
      lastUpdate: new Date().toLocaleTimeString(),
      
      availableWeeks: [8, 9, 10, 11, 12, 13],
      
      availableGroups: [
        "Groep A", "Groep B", "Groep C", "Groep D"
      ],
      
      // Basis studenten data
      allStudents: [
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
      
      // Aanwezigheid data per week
      weeklyAttendance: {
        8: [
          { nr: "1234", status: "Aanwezig", time: "08:30", notes: "" },
          { nr: "12345", status: "Te laat", time: "09:15", notes: "Vertraging openbaar vervoer" },
          { nr: "3134", status: "Afwezig", time: "", notes: "Ziek gemeld" },
          { nr: "9374", status: "Aanwezig", time: "08:25", notes: "" },
          { nr: "8903", status: "Aanwezig", time: "08:35", notes: "" },
          { nr: "92021", status: "Afwezig", time: "", notes: "Persoonlijke omstandigheden" },
          { nr: "5678", status: "Aanwezig", time: "08:20", notes: "" },
          { nr: "7890", status: "Aanwezig", time: "08:30", notes: "" },
          { nr: "1111", status: "Te laat", time: "09:45", notes: "Overslapen" },
          { nr: "2222", status: "Aanwezig", time: "08:28", notes: "" }
        ],
        9: [
          { nr: "1234", status: "Aanwezig", time: "08:32", notes: "" },
          { nr: "12345", status: "Aanwezig", time: "08:28", notes: "" },
          { nr: "3134", status: "Aanwezig", time: "08:40", notes: "Weer beter" },
          { nr: "9374", status: "Te laat", time: "09:20", notes: "Doktersafspraak" },
          { nr: "8903", status: "Afwezig", time: "", notes: "Familie bezoek" },
          { nr: "92021", status: "Aanwezig", time: "08:25", notes: "" },
          { nr: "5678", status: "Afwezig", time: "", notes: "Ziek" },
          { nr: "7890", status: "Aanwezig", time: "08:30", notes: "" },
          { nr: "1111", status: "Aanwezig", time: "08:35", notes: "" },
          { nr: "2222", status: "Te laat", time: "09:10", notes: "Auto kapot" }
        ],
        10: [
          { nr: "1234", status: "Te laat", time: "09:05", notes: "Trein vertraging" },
          { nr: "12345", status: "Afwezig", time: "", notes: "Sollicitatiegesprek" },
          { nr: "3134", status: "Afwezig", time: "", notes: "Ziek gemeld" },
          { nr: "9374", status: "Aanwezig", time: "08:30", notes: "" },
          { nr: "8903", status: "Aanwezig", time: "08:25", notes: "" },
          { nr: "92021", status: "Aanwezig", time: "08:30", notes: "" },
          { nr: "5678", status: "Aanwezig", time: "08:35", notes: "" },
          { nr: "7890", status: "Aanwezig", time: "08:28", notes: "" },
          { nr: "1111", status: "Afwezig", time: "", notes: "Familieomstandigheden" },
          { nr: "2222", status: "Aanwezig", time: "08:30", notes: "" }
        ],
        11: [
          { nr: "1234", status: "Aanwezig", time: "08:30", notes: "" },
          { nr: "12345", status: "Aanwezig", time: "08:25", notes: "" },
          { nr: "3134", status: "Aanwezig", time: "08:35", notes: "" },
          { nr: "9374", status: "Afwezig", time: "", notes: "Vakantie" },
          { nr: "8903", status: "Te laat", time: "09:30", notes: "Tandarts" },
          { nr: "92021", status: "Aanwezig", time: "08:30", notes: "" },
          { nr: "5678", status: "Aanwezig", time: "08:28", notes: "" },
          { nr: "7890", status: "Aanwezig", time: "08:32", notes: "" },
          { nr: "1111", status: "Aanwezig", time: "08:35", notes: "" },
          { nr: "2222", status: "Afwezig", time: "", notes: "Ziek" }
        ],
        12: [
          { nr: "1234", status: "Afwezig", time: "", notes: "Griep" },
          { nr: "12345", status: "Aanwezig", time: "08:30", notes: "" },
          { nr: "3134", status: "Te laat", time: "09:15", notes: "Verkeer" },
          { nr: "9374", status: "Aanwezig", time: "08:25", notes: "" },
          { nr: "8903", status: "Aanwezig", time: "08:30", notes: "" },
          { nr: "92021", status: "Te laat", time: "09:00", notes: "Overslapen" },
          { nr: "5678", status: "Afwezig", time: "", notes: "Ziek gemeld" },
          { nr: "7890", status: "Aanwezig", time: "08:28", notes: "" },
          { nr: "1111", status: "Aanwezig", time: "08:35", notes: "" },
          { nr: "2222", status: "Aanwezig", time: "08:30", notes: "" }
        ],
        13: [
          { nr: "1234", status: "Aanwezig", time: "08:30", notes: "" },
          { nr: "12345", status: "Te laat", time: "09:20", notes: "Overslapen" },
          { nr: "3134", status: "Aanwezig", time: "08:28", notes: "" },
          { nr: "9374", status: "Aanwezig", time: "08:30", notes: "" },
          { nr: "8903", status: "Afwezig", time: "", notes: "Sollicitatie" },
          { nr: "92021", status: "Aanwezig", time: "08:25", notes: "" },
          { nr: "5678", status: "Aanwezig", time: "08:30", notes: "" },
          { nr: "7890", status: "Afwezig", time: "", notes: "Familiebezoek" },
          { nr: "1111", status: "Te laat", time: "09:10", notes: "Bus gemist" },
          { nr: "2222", status: "Aanwezig", time: "08:32", notes: "" }
        ]
      },
      
      currentWeekData: [],
      filteredWeekData: []
    };
  },
  
  mounted() {
    this.updateWeekData();
    this.applyFilters();
    
    // Event listeners for closing dropdowns
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.browser-profile')) {
        this.showProfile = false;
      }
    });
  },
  
  computed: {
    presentCount() {
      return this.filteredWeekData.filter(s => s.status === 'Aanwezig').length;
    },
    
    absentCount() {
      return this.filteredWeekData.filter(s => s.status === 'Afwezig').length;
    },
    
    lateCount() {
      return this.filteredWeekData.filter(s => s.status === 'Te laat').length;
    },
    
    presentPercentage() {
      return this.filteredWeekData.length > 0 ? Math.round((this.presentCount / this.filteredWeekData.length) * 100) : 0;
    },
    
    absentPercentage() {
      return this.filteredWeekData.length > 0 ? Math.round((this.absentCount / this.filteredWeekData.length) * 100) : 0;
    },
    
    latePercentage() {
      return this.filteredWeekData.length > 0 ? Math.round((this.lateCount / this.filteredWeekData.length) * 100) : 0;
    },
    
    sortedStudents() {
      const sorted = [...this.filteredWeekData].sort((a, b) => {
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
      return Math.ceil(this.filteredWeekData.length / this.itemsPerPage);
    }
  },
  
  methods: {
    updateWeekData() {
      const weekAttendance = this.weeklyAttendance[this.selectedWeek] || [];
      
      this.currentWeekData = this.allStudents.map(student => {
        const attendance = weekAttendance.find(att => att.nr === student.nr);
        return {
          ...student,
          status: attendance?.status || 'Afwezig',
          time: attendance?.time || '',
          notes: attendance?.notes || ''
        };
      });
      
      this.applyFilters();
    },
    
    applyFilters() {
      let filtered = [...this.currentWeekData];
      
      if (this.selectedGroup !== "Alle") {
        filtered = filtered.filter(s => s.group === this.selectedGroup);
      }
      
      this.filteredWeekData = filtered;
      this.currentPage = 1;
      this.lastUpdate = new Date().toLocaleTimeString();
    },
    
    resetFilters() {
      this.selectedWeek = 8;
      this.selectedGroup = "Alle";
      this.updateWeekData();
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
    
    getStatusClass(status) {
      switch(status) {
        case 'Aanwezig':
          return 'status-present';
        case 'Afwezig':
          return 'status-absent';
        case 'Te laat':
          return 'status-late';
        default:
          return '';
      }
    },
    
    exportWeekData() {
      const csvContent = [
        'Student Nr,Naam,Groep,Status,Tijd,Opmerkingen',
        ...this.filteredWeekData.map(s => 
          `${s.nr},${s.name},${s.group},${s.status},${s.time || ''},${s.notes || ''}`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aanwezigheid_week_${this.selectedWeek}.csv`;
      a.click();
    },
    
    goBack() {
      if (this.canGoBack) {
        alert('Navigatie terug naar hoofdpagina');
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

<style src="./WeekOverviewAllStudents.css"></style>