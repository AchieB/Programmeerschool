<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ImportLogs extends Model
{
	use HasFactory;

	protected $fillable = [
		'bestandscode',
		'week',
		'jaar',
		'status',
		'aantal_verwerkt',
		'fouten',
		'bestandstype',
	];
	
    public function attendanceRecords()
{
    return $this->hasMany(AttendanceRecords::class);
}

public function errorLogs()
{
    return $this->hasMany(ErrorLog::class);
}
}
