<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Students extends Model
{
	use HasFactory;

	protected $fillable = [
		'studentnummer',
		'naam',
		'groep'
	];

public function attendenceRecords()
{
	return $this->hasMany(AttendanceRecords::class);
}
public function groups()
{
    return $this->belongsToMany(Group::class);
}
}
