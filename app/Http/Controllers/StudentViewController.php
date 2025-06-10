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
        
        // Pass API endpoints to the view - FULL URLs
        $apiEndpoints = [
            'studentData' => url('/api/students/' . ($studentnummer ?? '')),
            'weeklyData' => url('/api/students/' . ($studentnummer ?? '') . '/weekly-progress')
        ];
        
        \Log::debug('API endpoints', $apiEndpoints);
        
        return view('student-overview', [
            'student' => $student,
            'studentnummer' => $studentnummer,
            'apiEndpoints' => $apiEndpoints
        ]);
    }
}