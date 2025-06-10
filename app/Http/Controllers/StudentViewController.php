<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;

class StudentViewController extends Controller
{
    public function showOverview($studentnummer = null)
    {
        $student = null;
        if ($studentnummer) {
            $student = Student::where('studentnummer', $studentnummer)->first();
        }
        
        // Correcte API endpoints
        $apiEndpoints = [
            'studentData' => url('/api/students/' . ($studentnummer ?? '')),
            // Gebruik de bestaande route
            'weeklyData' => $studentnummer 
                ? url('/api/students/' . $studentnummer . '/weekly-progress') 
                : url('/api/attendance/weekly-progress')
        ];
        
        return view('student-overview', [
            'student' => $student,
            'studentnummer' => $studentnummer,
            'apiEndpoints' => $apiEndpoints
        ]);
    }
}