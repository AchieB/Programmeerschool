<!-- components/StatisticsCards.vue -->
<template>
  <section class="info-cards">
    <div class="info-card" @click="$emit('show-all-students')">
      <div>Aantal studenten</div>
      <div class="info-main">{{ filteredStudents.length }}</div>
    </div>
    
    <div class="info-card" @click="$emit('show-average-details')">
      <div>Gemiddelde aanwezigheid</div>
      <div class="info-main">{{ averageAttendance }}%</div>
    </div>
    
    <div class="info-card danger" @click="$emit('show-low-performers')">
      <div>Aantal 0 studenten</div>
      <div class="info-main">
        {{ lowPerformersCount }}
        <div class="info-sub">&lt;50%</div>
      </div>
    </div>
    
    <div class="info-card success" @click="$emit('show-top-performers')">
      <div>Aantal top studenten</div>
      <div class="info-main">
        {{ topPerformersCount }}
        <div class="info-sub">&gt;85%</div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'StatisticsCards',
  
  props: {
    filteredStudents: {
      type: Array,
      required: true
    }
  },
  
  emits: [
    'show-all-students',
    'show-average-details',
    'show-low-performers',
    'show-top-performers'
  ],
  
  computed: {
    averageAttendance() {
      if (this.filteredStudents.length === 0) return 0;
      
      const totalAttendance = this.filteredStudents.reduce(
        (sum, student) => sum + student.attendance, 
        0
      );
      
      return Math.round(totalAttendance / this.filteredStudents.length);
    },
    
    lowPerformersCount() {
      return this.filteredStudents.filter(
        student => student.attendance < 50
      ).length;
    },
    
    topPerformersCount() {
      return this.filteredStudents.filter(
        student => student.attendance > 85
      ).length;
    }
  }
};
</script>