<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StudentViewController;

Route::get('/student-overview/{studentnummer?}', [StudentViewController::class, 'showOverview']);

// Import data route blijft ongewijzigd
Route::get('/import-data', function () {
    return view('import-data', [
        'importHistory' => []
    ]);
});
