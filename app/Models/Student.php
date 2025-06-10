<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Student extends Model
{
        use HasFactory;

    protected $fillable = [
        'studentnummer',
        'naam',
        'klas'
    ];

    /**
     * Get the attendance records for the student.
     */
    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class, 'studentnummer', 'studentnummer');
    }
}

