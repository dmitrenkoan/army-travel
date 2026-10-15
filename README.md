# Попутники в дорозі (Army Travel)

Закритий застосунок для пошуку попутників між військовослужбовцями.

- **Backend**: Laravel 13 (PHP 8.5), REST API, Sanctum (token auth), PostgreSQL
- **Frontend**: React 19 + TypeScript (Vite), React Router, Google Maps JS API (Places + Directions)

## Структура

```
backend/   Laravel API (army_travel PostgreSQL database)
frontend/  React SPA
```

## Ролі

- **super_admin** — створює військові частини та адміністраторів частин (`unit_admin`)
- **unit_admin** — створює користувачів (`user`) у межах своєї військової частини
- **user** — створює поїздки, шукає попутні маршрути, бронює місця

## Запуск (dev)

Backend потребує PHP 8.3+ (на цій машині системний `php` у PATH — 7.2, тому
команди нижче явно викликають `/opt/homebrew/opt/php/bin/php`, якщо у вас
аналогічна ситуація — підлаштуйте шлях):

```bash
cd backend
cp .env.example .env   # якщо .env відсутній; налаштуйте DB_* на вашу PostgreSQL
php artisan migrate --seed
php artisan serve --port=8001
```

```bash
cd frontend
cp .env.example .env
# впишіть власний VITE_GOOGLE_MAPS_API_KEY (потрібні APIs: Maps JavaScript API,
# Places API, Directions API)
npm install
npm run dev   # http://localhost:5174
```

## Створення супер адміністратора

Крім сідера, є окрема artisan-команда — зручно для продакшну, де сідер з
жорстко закодованим паролем запускати не варто:

```bash
php artisan app:create-super-admin --name="ПІБ" --phone="+380..." --email="admin@example.com" --password="..."
```

Без опцій команда запитає дані інтерактивно (пароль — приховано, з
підтвердженням). При запуску без інтерактивного вводу (`--no-interaction`,
CI/CD, деплой-хуки) `--password` обов'язковий — інакше команда одразу
завершиться з помилкою, а не чекатиме вводу.

## Тестові облікові записи (із сідера)

| Роль | Телефон | Пароль |
|---|---|---|
| super_admin | +380000000000 | password |
| unit_admin  | +380000000001 | password |
| user        | +380000000002 | password |

## Об'єднаний деплой (frontend + backend в одному Laravel-застосунку)

Фронтенд і бекенд можна розгорнути як один деплой: React збирається прямо в
`backend/public/build`, а Laravel віддає SPA-шелл для всіх маршрутів, крім
`/api/*` і `/up`. Завдяки цьому CORS не потрібен — фронтенд ходить на `/api`
того ж домену.

```bash
cd frontend
npm ci
npm run build   # записує build/ прямо в backend/public/build (manifest.json)
```

Механіка:

- `frontend/vite.config.ts` — під час `vite build` (не під час `npm run dev`,
  той лишається незмінним на порті 5174) компілює вхідну точку `src/main.tsx`
  напряму в `backend/public/build/` з `base: '/build/'` та увімкненим
  `manifest`.
- `frontend/.env.production` — задає `VITE_API_URL=/api` (відносний шлях)
  лише для продакшн-збірки. `VITE_GOOGLE_MAPS_API_KEY` туди навмисно не
  записаний — його треба передавати як справжню змінну середовища на етапі
  білда (напр. у налаштуваннях білда Laravel Cloud), щоб ключ не потрапив у
  репозиторій.
- `backend/routes/web.php` — один catch-all маршрут `Route::view('/{any}',
  'app')`, що віддає `resources/views/app.blade.php` для будь-якого шляху,
  окрім `api/*` та `up`. React Router сам розбирається з конкретним
  маршрутом на клієнті.
- `backend/resources/views/app.blade.php` — читає
  `public/build/.vite/manifest.json` і підставляє правильні (хешовані)
  посилання на `<script>`/`<link>`.
- `backend/public/favicon.svg` і `icons.svg` — статичні копії з
  `frontend/public/`, віддаються напряму з кореня домену.

Деплой на Laravel Cloud у цьому варіанті: build-команда виконує і
`composer install`, і `npm ci && npm run build` для `frontend/` (саме в
такому порядку — build фронтенду має відбутись до того, як Cloud кладе
`backend/public` на прод), а в деплой-хук додається `php artisan migrate
--force`. `FRONTEND_URL`/CORS більше не потрібні, якщо не плануєте окремий
клієнт на іншому домені.

## Як працює пошук попутного маршруту

При створенні поїздки фронтенд будує маршрут через Google Directions API та
надсилає на backend список точок маршруту з накопиченою відстанню/часом від
початку (`route_path`). Під час пошуку (`GET /api/trips`) сервіс
`App\Services\RouteMatcher` (`backend/app/Services/RouteMatcher.php`) знаходить
найближчі до шуканих точок виїзду/призначення точки на збережених маршрutах
(формула гаверсинуса) і перевіряє, що вони йдуть у правильному порядку вздовж
маршруту водія — так проміжні ділянки чужого маршруту (напр. Житомир у
маршруті Київ → Львів) теж потрапляють у результати пошуку, з коректно
розрахованим часом у дорозі для цієї ділянки.
