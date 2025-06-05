<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StudentController;

Route::get('/student-overview', [StudentController::class, 'overview']);
Route::get('/', function () {
    return view('student-overview');
});
