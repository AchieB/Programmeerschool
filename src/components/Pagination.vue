<!-- components/Pagination.vue -->
<template>
  <div class="pagination">
    <button 
      @click="goToPage(1)" 
      :disabled="currentPage === 1" 
      class="page-btn"
    >
      First
    </button>
    
    <button 
      @click="goToPage(currentPage - 1)" 
      :disabled="currentPage === 1" 
      class="page-btn"
    >
      Prev
    </button>
    
    <span class="page-info">
      {{ currentPage }} van {{ totalPages }}
    </span>
    
    <button 
      @click="goToPage(currentPage + 1)" 
      :disabled="currentPage === totalPages" 
      class="page-btn"
    >
      Next
    </button>
    
    <button 
      @click="goToPage(totalPages)" 
      :disabled="currentPage === totalPages" 
      class="page-btn"
    >
      Last
    </button>
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  
  props: {
    currentPage: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    }
  },
  
  emits: ['page-change'],
  
  methods: {
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.$emit('page-change', page);
      }
    }
  }
};
</script>