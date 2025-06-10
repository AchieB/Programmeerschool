<!-- components/StudentsTable.vue -->
<template>
  <section class="students-table-section">
    <!-- Table Header with Actions -->
    <div class="table-header">
      <h3>Studenten Overzicht</h3>
      <div class="table-actions">
        <button 
          @click="sort('name')" 
          class="sort-btn" 
          :class="{ active: sortField === 'name' }"
        >
          Naam {{ getSortIndicator('name') }}
        </button>
        
        <button 
          @click="sort('attendance')" 
          class="sort-btn" 
          :class="{ active: sortField === 'attendance' }"
        >
          Aanwezigheid {{ getSortIndicator('attendance') }}
        </button>
        
        <button @click="downloadPDF" class="download-btn">
          Download PDF
        </button>
      </div>
    </div>

    <!-- Table -->
    <table class="students-table">
      <thead>
        <tr>
          <th @click="sort('nr')" class="sortable">
            Student nr: {{ getSortIndicator('nr') }}
          </th>
          <th @click="sort('name')" class="sortable">
            Naam {{ getSortIndicator('name') }}
          </th>
          <th @click="sort('attendance')" class="sortable">
            Gem. {{ getSortIndicator('attendance') }}
          </th>
          <th>Acties</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="student in students" 
          :key="student.nr" 
          @click="selectStudent(student)" 
          :class="{ selected: isSelected(student) }"
        >
          <td>{{ student.nr }}</td>
          <td>{{ student.name }}</td>
          <td>
            <span
              class="att-percentage"
              :class="getAttendanceClass(student.attendance)"
            >
              {{ student.attendance }}%
            </span>
          </td>
          <td>
            <button 
              @click.stop="editStudent(student)" 
              class="action-btn edit"
            >
              Edit
            </button>
            <button 
              @click.stop="deleteStudent(student)" 
              class="action-btn delete"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <Pagination 
      v-if="totalPages > 1"
      :currentPage="currentPage"
      :totalPages="totalPages"
      @page-change="changePage"
    />
  </section>
</template>

<script>
import Pagination from './Pagination.vue'

export default {
  name: 'StudentsTable',
  
  components: {
    Pagination
  },
  
  props: {
    students: {
      type: Array,
      required: true
    },
    sortField: {
      type: String,
      required: true
    },
    sortOrder: {
      type: String,
      required: true
    },
    selectedStudent: {
      type: Object,
      default: null
    },
    currentPage: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    },
    selectedWeek: {
      type: String,
      default: 'Week 10'
    },
    selectedYear: {
      type: String,
      default: '2025'
    },
    allStudents: {
      type: Array,
      default: () => []
    }
  },
  
  emits: [
    'sort',
    'select-student',
    'edit-student',
    'delete-student',
    'export',
    'page-change'
  ],
  
  methods: {
    sort(field) {
      this.$emit('sort', field);
    },
    
    selectStudent(student) {
      this.$emit('select-student', student);
    },
    
    editStudent(student) {
      this.$emit('edit-student', student);
    },
    
    deleteStudent(student) {
      this.$emit('delete-student', student);
    },
    
    changePage(page) {
      this.$emit('page-change', page);
    },
    
    isSelected(student) {
      return this.selectedStudent?.nr === student.nr;
    },
    
    getSortIndicator(field) {
      if (this.sortField !== field) return '';
      return this.sortOrder === 'asc' ? '↑' : '↓';
    },
    
    getAttendanceClass(attendance) {
      if (attendance >= 85) return 'att-green';
      if (attendance >= 50) return 'att-yellow';
      return 'att-red';
    },

    async downloadPDF() {
      try {
        // Check if jsPDF is already loaded globally
        let jsPDF;
        
        if (window.jspdf && window.jspdf.jsPDF) {
          jsPDF = window.jspdf.jsPDF;
        } else {
          // Load jsPDF dynamically
          await this.loadjsPDF();
          jsPDF = window.jspdf.jsPDF;
        }
        
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text('Studenten Aanwezigheid Rapport', 20, 20);
        
        // Add metadata
        doc.setFontSize(12);
        doc.text(`Periode: ${this.selectedWeek} ${this.selectedYear}`, 20, 35);
        doc.text(`Gegenereerd op: ${new Date().toLocaleDateString('nl-NL')}`, 20, 45);
        doc.text(`Aantal studenten: ${this.allStudents.length}`, 20, 55);
        
        // Calculate statistics
        const attendances = this.allStudents.map(s => s.attendance);
        const avgAttendance = Math.round(attendances.reduce((sum, att) => sum + att, 0) / attendances.length);
        const highPerformers = attendances.filter(att => att >= 85).length;
        const lowPerformers = attendances.filter(att => att < 50).length;
        
        // Add statistics
        doc.text(`Gemiddelde aanwezigheid: ${avgAttendance}%`, 20, 65);
        doc.text(`Hoge prestaties (≥85%): ${highPerformers} studenten`, 20, 75);
        doc.text(`Lage prestaties (<50%): ${lowPerformers} studenten`, 20, 85);
        
        // Table headers
        const startY = 105;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Student Nr', 20, startY);
        doc.text('Naam', 60, startY);
        doc.text('Groep', 100, startY);
        doc.text('Aanwezigheid', 140, startY);
        doc.text('Status', 170, startY);
        
        // Draw header line
        doc.line(20, startY + 3, 190, startY + 3);
        
        // Table data
        doc.setFont(undefined, 'normal');
        let yPosition = startY + 15;
        
        this.allStudents.forEach((student, index) => {
          // Check if we need a new page
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
            
            // Repeat headers on new page
            doc.setFont(undefined, 'bold');
            doc.text('Student Nr', 20, yPosition);
            doc.text('Naam', 60, yPosition);
            doc.text('Groep', 100, yPosition);
            doc.text('Aanwezigheid', 140, yPosition);
            doc.text('Status', 170, yPosition);
            doc.line(20, yPosition + 3, 190, yPosition + 3);
            doc.setFont(undefined, 'normal');
            yPosition += 15;
          }
          
          // Student data
          doc.text(student.nr.toString(), 20, yPosition);
          doc.text(student.name, 60, yPosition);
          doc.text(student.group, 100, yPosition);
          doc.text(`${student.attendance}%`, 140, yPosition);
          
          // Status based on attendance
          let status = '';
          if (student.attendance >= 85) status = 'Uitstekend';
          else if (student.attendance >= 70) status = 'Goed';
          else if (student.attendance >= 50) status = 'Voldoende';
          else status = 'Onvoldoende';
          
          doc.text(status, 170, yPosition);
          
          yPosition += 10;
        });
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text(`Pagina ${i} van ${pageCount}`, 170, 290);
          doc.text('Docent Overzicht Systeem', 20, 290);
        }
        
        // Generate filename
        const filename = `studenten_rapport_${this.selectedYear}_${this.selectedWeek.replace(' ', '_')}.pdf`;
        
        // Save the PDF
        doc.save(filename);
        
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Er is een fout opgetreden bij het genereren van de PDF. Probeer het opnieuw.');
      }
    },

    loadjsPDF() {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.jspdf && window.jspdf.jsPDF) {
          resolve();
          return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
          if (window.jspdf && window.jspdf.jsPDF) {
            resolve();
          } else {
            reject(new Error('jsPDF failed to load'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load jsPDF script'));
        
        // Add to document head
        document.head.appendChild(script);
      });
    }
  }
};
</script>