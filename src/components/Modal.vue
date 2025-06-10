<!-- components/Modal.vue -->
<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <div class="modal-content">
        <!-- Students List Modal -->
        <div v-if="type === 'students'" class="student-list">
          <div 
            v-for="student in students" 
            :key="student.nr" 
            class="student-item"
          >
            <span>{{ student.name }} ({{ student.nr }})</span>
            <span 
              class="attendance-badge" 
              :class="getAttendanceClass(student.attendance)"
            >
              {{ student.attendance }}%
            </span>
          </div>
        </div>
        
        <!-- Average Details Modal -->
        <div v-else-if="type === 'average'" class="average-details">
          <div class="stat-row">
            <span>Hoogste aanwezigheid:</span>
            <span>{{ averageDetails.highest }}%</span>
          </div>
          <div class="stat-row">
            <span>Laagste aanwezigheid:</span>
            <span>{{ averageDetails.lowest }}%</span>
          </div>
          <div class="stat-row">
            <span>Mediaan:</span>
            <span>{{ averageDetails.median }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Modal',
  
  props: {
    show: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      required: true,
      validator: (value) => ['students', 'average'].includes(value)
    },
    title: {
      type: String,
      required: true
    },
    students: {
      type: Array,
      default: () => []
    },
    averageDetails: {
      type: Object,
      default: () => ({
        highest: 0,
        lowest: 0,
        median: 0
      })
    }
  },
  
  emits: ['close'],
  
  methods: {
    getAttendanceClass(attendance) {
      if (attendance >= 85) return 'att-green';
      if (attendance >= 50) return 'att-yellow';
      return 'att-red';
    }
  }
};
</script>