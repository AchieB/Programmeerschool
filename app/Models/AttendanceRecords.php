<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class AttendanceRecords extends Model
{
	use HasFactory;

	protected	$fillable = [
		'student_id',
		'import_log_id',
		'aanwezigheid',
		'rooster',
		'week',
		'jaar',
	];
	
public function student()
{
    return $this->belongsTo(Students::class);
}

public function importLog()
{
    return $this->belongsTo(ImportLogs::class);
}
}
