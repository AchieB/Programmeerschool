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
        'geimporteerd_op'
    ];

    protected $casts = [
        'geimporteerd_op' => 'datetime'
    ];
}
