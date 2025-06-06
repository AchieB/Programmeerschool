<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\ImportController;
use App\Http\Controllers\Api\ReportController;


Route::middleware('api')->group(function () {

	//importeer endpoints
	Route::prefix('import')->group(function () {
		Route::post('/upload', [ImportController::class, 'upload']);
		Route::get('/logs', [ImportController::class, 'logs']);
	});

	// Student endpoints
	Route::prefix('students')->group(function	()	{
		Route::get('/', [StudentController::class, 'index']);
		Route::get('/week/{week}/jaar/{jaar}', [StudentController::class, 'byWeek']);
		Route::get('/{studentnummer}', [StudentController::class, 'show']);
		Route::get('/{studentnummer}/weekly-progress', [StudentController::class, 'weeklyProgress']);
	});

	// Attendance endpoints 
	Route::prefix('attendance')->group(function () {
		Route::get('/', [AttendanceController::class, 'index']);
		Route::get('/statistics', [AttendanceController::class, 'statistics']);
	});

	// Report endpoints 
	Route::prefix('reports')->group(function () {
		Route::get('/students-by-percentage', [ReportController::class, 'studentsPercentageFilter']);
		Route::get('/weekly-comparison', [ReportController::class, 'weeklyComparison']);
	});
});

