<?php

use Illuminate\Support\Facades\Route;

// Everything that isn't /api/* or the health check is a client-side React
// Router route — always hand back the same SPA shell and let the frontend
// resolve it. Static files under public/ (built JS/CSS, favicon.svg, ...)
// never reach this route: the web server serves them directly before the
// request hits Laravel.
Route::view('/{any}', 'app')->where('any', '^(?!api(?:/|$)|up$).*$');
