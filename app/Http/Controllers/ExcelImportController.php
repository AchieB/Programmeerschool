<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;


class ExcelImportController extends Controller
{
    public function import(Request $request)
		{
			$request->validate([
				'file' => 'required|mimes:xlsx,xls',
			]);

			$file = $request->file('file');

			Excel::import( , $file);

			return redirect()->back()->with('succes', 'Het excel bestand is op de juiste manier geïmporteerd');
		}
}
