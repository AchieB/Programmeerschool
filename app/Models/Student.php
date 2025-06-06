<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Student extends Model
{
        use HasFactory;

    protected $fillable = [
        'studentnummer',
        'naam'
    ];

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class, 'studentnummer', 'studentnummer');
    }

    public function getAttendancePercentageAttribute()
    {
        $records = $this->attendanceRecords;
        if ($records->count() === 0) return 0;

        $totalAanwezigheid = $records->sum('aanwezigheid');
        $totalRooster = $records->sum('rooster');
        
        if ($totalRooster === 0) return 0;

        return round(($totalAanwezigheid / $totalRooster) * 100, 2);
    }

    public function getAttendanceCategoryAttribute()
    {
        $percentage = $this->attendance_percentage;

        
        if ($percentage > 100) return 'Perfect';
        if ($percentage >= 95) return 'Excellent';
        if ($percentage >= 80) return 'Goed';
        if ($percentage >= 65) return 'Voldoende';
        if ($percentage >= 50) return 'Onvoldoende';
				if ($percentage >= 0)	return 'Kritiek';
				if ($percentage === 0) return 'Geen aanwezigheid';
        
        
    }
}
}
