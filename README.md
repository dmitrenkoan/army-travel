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

## Тестові облікові записи (із сідера)

| Роль | Телефон | Пароль |
|---|---|---|
| super_admin | +380000000000 | password |
| unit_admin  | +380000000001 | password |
| user        | +380000000002 | password |

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
