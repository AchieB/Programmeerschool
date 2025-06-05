<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function overview()
    {
        $data = [
            'studentName' => 'Jan Jansen',
            'studentNumber' => '12345',
            'studentClass' => '4A',
            'studentCount' => 6,
            'average' => 68,
            'zeroStudents' => 2,
            'topStudents' => 2
        ];

        return view('student-overview', $data);
    }
}
