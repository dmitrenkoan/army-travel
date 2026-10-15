@php
    $manifestPath = public_path('build/.vite/manifest.json');
    $manifest = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : null;
    $entry = $manifest['src/main.tsx'] ?? null;
@endphp
<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Попутники — пошук попутників в дорозі</title>
    @if ($entry)
      @foreach ($entry['css'] ?? [] as $cssFile)
        <link rel="stylesheet" href="/build/{{ $cssFile }}">
      @endforeach
    @endif
  </head>
  <body>
    <div id="root"></div>
    @if ($entry)
      <script type="module" src="/build/{{ $entry['file'] }}"></script>
    @else
      <p style="font-family: sans-serif; padding: 24px;">
        Frontend build not found. Run <code>npm run build</code> in <code>frontend/</code>
        (it writes into <code>backend/public/build</code>).
      </p>
    @endif
  </body>
</html>
