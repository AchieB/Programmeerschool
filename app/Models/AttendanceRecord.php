<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class AttendanceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'studentnummer',
        'aanwezigheid',
        'rooster',
        'week',
        'jaar',
        'bron_bestand',
        'geimporteerd_op'
    ];

    protected $casts = [
        'geimporteerd_op' => 'datetime'
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'studentnummer', 'studentnummer');
    }

    public function getAttendancePercentageAttribute()
    {
        if ($this->rooster === 0) return 0;
        return round(($this->aanwezigheid / $this->rooster) * 100, 2);
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
