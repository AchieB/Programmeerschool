<template>
  <section class="filter-panel">
    <!-- Year Selector -->
    <div>
      <label>
        Jaar
        <select 
          :value="selectedYear" 
          class="input-compact year-selector" 
          @change="updateYear"
        >
          <option 
            v-for="year in availableYears" 
            :key="year" 
            :value="year"
          >
            {{ year }}
          </option>
        </select>
      </label>
    </div>

    <!-- Week Selector -->
    <div>
      <label>
        Week
        <select 
          :value="selectedWeek" 
          class="input-compact" 
          @change="updateWeek"
        >
          <option 
            v-for="week in availableWeeks" 
            :key="week" 
            :value="week"
          >
            {{ week }}
          </option>
        </select>
      </label>
    </div>

    <!-- Group Selector -->
    <div>
      <label>
        Groep
        <select 
          :value="selectedGroup" 
          class="input-compact" 
          @change="updateGroup"
        >
          <option value="Alle">Alle</option>
          <option 
            v-for="group in availableGroups" 
            :key="group" 
            :value="group"
          >
            {{ group }}
          </option>
        </select>
      </label>
    </div>

    <!-- Student Selector -->
    <div>
      <label>
        Student
        <select 
          :value="selectedStudent" 
          class="input-compact" 
          @change="updateStudent"
        >
          <option value="Alle studenten">Alle studenten</option>
          <option 
            v-for="student in allStudents" 
            :key="student.nr" 
            :value="student.nr"
          >
            {{ student.name }}
          </option>
        </select>
      </label>
    </div>

    <!-- Year Info Display -->
    <div v-if="selectedYear" class="year-info">
      <span class="info-icon">📅</span>
      <span class="info-text">{{ selectedYear }} - {{ getYearDescription() }}</span>
    </div>

    <!-- Action Buttons -->
    <button class="filter-btn details-btn" @click="$emit('go-to-details')">
      <span class="btn-icon">👤</span>
      Student Details
    </button>
    
    <button class="filter-btn" @click="$emit('filter')">
      Filteren
    </button>
    
    <button class="reset-btn" @click="$emit('reset')">
      Reset
    </button>
  </section>
</template>

<script>
export default {
  name: 'FilterPanel',
  
  props: {
    selectedWeek: String,
    selectedGroup: String,
    selectedStudent: String,
    selectedYear: String,
    availableWeeks: Array,
    availableGroups: Array,
    availableYears: Array,
    allStudents: Array
  },
  
  emits: [
    'update-week',
    'update-group', 
    'update-student',
    'update-year',
    'filter',
    'reset',
    'go-to-details'
  ],
  
  computed: {
    // Always show year info when a year is selected
    showYearInfo() {
      return this.selectedYear !== null;
    }
  },
  
  methods: {
    updateWeek(event) {
      this.$emit('update-week', event.target.value);
    },
    
    updateGroup(event) {
      this.$emit('update-group', event.target.value);
    },
    
    updateStudent(event) {
      this.$emit('update-student', event.target.value);
    },
    
    updateYear(event) {
      this.$emit('update-year', event.target.value);
    },
    
    // Get descriptive text for the selected year
    getYearDescription() {
      if (this.selectedYear === "2024") {
        return "Lagere aanwezigheidspercentages";
      } else if (this.selectedYear === "2025") {
        return "Hogere aanwezigheidspercentages";
      }
      return "";
    }
  }
};
</script>

<style src="../styles/FilterPanel.css"></style>