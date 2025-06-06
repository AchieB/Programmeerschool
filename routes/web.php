<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StudentController;

Route::get('/student-overview', [StudentController::class, 'overview']);
Route::get('/', function () {
    return view('student-overview');
});
// Route::get('/import-data', [StudentController::class, 'import-data']);
// Route::get('/', function () {
//     return view('import-data');
// });
Route::get('/import-data', function () {
    return view('import-data', [
        'importHistory' => []
    ]);
});
