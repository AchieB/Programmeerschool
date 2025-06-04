<?php

namespace App\Http\Controllers;

use App\Imports\AttendanceImport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ImportController extends Controller
{
    public function import(Request $request)
		{
			$request->validate([
				'file' => 'required|mimes:xlsx,xls,ods|max:2048',
			]);

			try {
				Excel::import(new AttendanceImport, $request->file('file'));
				return back()->with('success', 'Het importbestand is geïmporteerd.');
			} catch(\Exception $e) {
				return back()->with('error', 'Deze bestanden zijn niet op de juiste manier geïmporteerd: '	. $e->getMessage());
			}
		}
}
