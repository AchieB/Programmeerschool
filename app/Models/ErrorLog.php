<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ErrorLog extends Model
{
		use HasFactory;

		protected $fillable = [
			'import_log_id',
			'studentnummer',
			'beschrijving',
		];

    public function importLog()
{
    return $this->belongsTo(ImportLogs::class);
}
}
