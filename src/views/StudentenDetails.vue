<template>
  <div class="student-details">
    <!-- Header met student info -->
    <header class="student-header">
      <div class="student-info">
        <span class="info-label">Student Naam:</span>
        <span class="info-value">{{ selectedStudent.name }}</span>
        
        <span class="info-label">Student nr:</span>
        <span class="info-value">{{ selectedStudent.nr }}</span>
        
        <span class="info-label">Student Klas:</span>
        <span class="info-value">{{ selectedStudent.group }}</span>
      </div>
      
      <button class="back-btn" @click="goBack">
        Terug naar overzicht
      </button>
    </header>

    <!-- Statistics Cards -->
    <div class="stats-container">
      <div class="stat-card overall">
        <div class="stat-header">Gemiddelde overzicht</div>
        <div class="stat-main">{{ overallAverage }}%</div>
        <div class="stat-period">Week 1-10</div>
      </div>
      
      <div class="stat-card best">
        <div class="stat-header">Beste week</div>
        <div class="stat-main best-week">{{ bestWeek.week }}</div>
        <div class="stat-percentage best-percentage">{{ bestWeek.percentage }}%</div>
      </div>
      
      <div class="stat-card worst">
        <div class="stat-header">Slechtste week</div>
        <div class="stat-main worst-week">{{ worstWeek.week }}</div>
        <div class="stat-percentage worst-percentage">{{ worstWeek.percentage }}%</div>
      </div>
    </div>

    <!-- Weekly Overview Table -->
    <div class="weekly-overview">
      <h3 class="table-title">Wekelijks overzicht</h3>
      
      <table class="weekly-table">
        <thead>
          <tr>
            <th class="week-column">Week</th>
            <th class="percentage-column">%</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="week in weeklyData" :key="week.week" class="week-row">
            <td class="week-cell">{{ week.week }}</td>
            <td class="percentage-cell">
              <span 
                class="percentage-value" 
                :class="getPercentageClass(week.percentage)"
              >
                {{ week.percentage }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "StudentenDetails",
  data() {
    return {
      selectedWeek: "Week 1",
      selectedStudent: {
        nr: "",
        name: "",
        group: ""
      },
      availableWeeks: [
        "Week 1", "Week 2", "Week 3", "Week 4", "Week 5", 
        "Week 6", "Week 7", "Week 8", "Week 9", "Week 10"
      ],
      weeklyAttendanceData: {}
    };
  },
  computed: {
    weeklyData() {
      return this.availableWeeks.map(week => ({
        week,
        percentage: this.weeklyAttendanceData[week] || 0
      }));
    },
    overallAverage() {
      const values = Object.values(this.weeklyAttendanceData);
      if (!values.length) return 0;
      const sum = values.reduce((acc, val) => acc + val, 0);
      return Math.round(sum / values.length);
    },
    bestWeek() {
      let best = { week: "Week 1", percentage: 0 };
      for (const [week, percentage] of Object.entries(this.weeklyAttendanceData)) {
        if (percentage > best.percentage) best = { week, percentage };
      }
      return best;
    },
    worstWeek() {
      let worst = { week: "Week 1", percentage: 100 };
      for (const [week, percentage] of Object.entries(this.weeklyAttendanceData)) {
        if (percentage < worst.percentage) worst = { week, percentage };
      }
      return worst;
    }
  },
  mounted() {
    this.loadStudentDataFromRoute();
  },
  methods: {
    updateWeekData() {
      console.log(`Selected week changed to: ${this.selectedWeek}`);
    },
    loadStudentDataFromRoute() {
      const studentId = this.$route.params.studentId;

      const studentMap = {
        "1234": { nr: "1234", name: "Sara", group: "Groep A" },
        "12345": { nr: "12345", name: "Saam", group: "Groep A" },
        "3134": { nr: "3134", name: "Boo", group: "Groep B" },
        "9374": { nr: "9374", name: "Laan", group: "Groep B" },
        "8903": { nr: "8903", name: "Saar", group: "Groep C" },
        "92021": { nr: "92021", name: "Lana", group: "Groep C" },
        "5678": { nr: "5678", name: "Tom", group: "Groep A" },
        "7890": { nr: "7890", name: "Emma", group: "Groep D" },
        "1111": { nr: "1111", name: "Max", group: "Groep D" },
        "2222": { nr: "2222", name: "Lisa", group: "Groep B" }
      };

      const attendanceMap = {
        "1234": { "Week 1": 81, "Week 2": 80, "Week 3": 80, "Week 4": 84, "Week 5": 32, "Week 6": 72, "Week 7": 78, "Week 8": 75, "Week 9": 85, "Week 10": 90 },
        "12345": { "Week 1": 65, "Week 2": 68, "Week 3": 70, "Week 4": 72, "Week 5": 45, "Week 6": 75, "Week 7": 78, "Week 8": 60, "Week 9": 82, "Week 10": 88 },
        "3134": { "Week 1": 45, "Week 2": 40, "Week 3": 38, "Week 4": 42, "Week 5": 25, "Week 6": 35, "Week 7": 32, "Week 8": 45, "Week 9": 48, "Week 10": 50 },
        "9374": { "Week 1": 86, "Week 2": 89, "Week 3": 90, "Week 4": 91, "Week 5": 93, "Week 6": 94, "Week 7": 93, "Week 8": 88, "Week 9": 92, "Week 10": 90 },
        "8903": { "Week 1": 32, "Week 2": 35, "Week 3": 40, "Week 4": 38, "Week 5": 48, "Week 6": 50, "Week 7": 52, "Week 8": 32, "Week 9": 48, "Week 10": 43 },
        "92021": { "Week 1": 91, "Week 2": 88, "Week 3": 87, "Week 4": 90, "Week 5": 92, "Week 6": 90, "Week 7": 92, "Week 8": 95, "Week 9": 88, "Week 10": 92 },
        "5678": { "Week 1": 70, "Week 2": 75, "Week 3": 78, "Week 4": 80, "Week 5": 84, "Week 6": 82, "Week 7": 88, "Week 8": 70, "Week 9": 75, "Week 10": 78 },
        "7890": { "Week 1": 95, "Week 2": 92, "Week 3": 94, "Week 4": 96, "Week 5": 98, "Week 6": 99, "Week 7": 100, "Week 8": 92, "Week 9": 96, "Week 10": 95 },
        "1111": { "Week 1": 38, "Week 2": 42, "Week 3": 44, "Week 4": 45, "Week 5": 48, "Week 6": 50, "Week 7": 52, "Week 8": 38, "Week 9": 42, "Week 10": 45 },
        "2222": { "Week 1": 85, "Week 2": 88, "Week 3": 90, "Week 4": 92, "Week 5": 94, "Week 6": 91, "Week 7": 93, "Week 8": 85, "Week 9": 90, "Week 10": 88 }
      };

      this.selectedStudent = studentMap[studentId] || { nr: "Onbekend", name: "Onbekend", group: "-" };
      this.weeklyAttendanceData = attendanceMap[studentId] || {};
    },
    getPercentageClass(percentage) {
      if (percentage >= 85) return 'high-attendance';
      if (percentage >= 50) return 'medium-attendance';
      return 'low-attendance';
    },
    goBack() {
      this.$router.push({ name: 'DocentDashboard' });
    }
  }
};
</script>

<style src="../styles/StudentenDetails.css"></style>