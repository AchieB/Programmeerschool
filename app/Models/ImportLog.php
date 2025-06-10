<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ImportLog extends Model
{
        use HasFactory;

    protected $fillable = [
        'bestandsnaam',
        'status',
        'bericht',
        'aantal_records',
        'aantal_nieuwe_studenten',
        'aantal_updates',
        'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime'
    ];
}
