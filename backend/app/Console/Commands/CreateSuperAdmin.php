<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateSuperAdmin extends Command
{
    protected $signature = 'app:create-super-admin
        {--name= : ПІБ}
        {--phone= : Номер телефону (використовується для входу)}
        {--email= : Email (необов\'язково)}
        {--password= : Пароль (якщо не вказано — буде запропоновано ввести)}';

    protected $description = 'Створити користувача з роллю super_admin';

    public function handle(): int
    {
        $name = $this->option('name') ?: $this->ask('ПІБ');
        $phone = $this->option('phone') ?: $this->ask('Номер телефону у форматі +380XXXXXXXXX (для входу)');
        $email = $this->option('email') ?: $this->ask('Email (необов\'язково, Enter щоб пропустити)');
        $password = $this->option('password');

        if (! $password && ! $this->input->isInteractive()) {
            $this->error('Вкажіть пароль через --password, коли команда запускається без інтерактивного вводу (--no-interaction).');

            return self::FAILURE;
        }

        while (! $password) {
            $password = $this->secret('Пароль (мін. 6 символів)');
            $confirmation = $this->secret('Підтвердіть пароль');

            if (! $password || $password !== $confirmation) {
                $this->error('Паролі не співпадають або порожні. Спробуйте ще раз.');
                $password = null;
            }
        }

        $validator = Validator::make([
            'name' => $name,
            'phone' => $phone,
            'email' => $email ?: null,
            'password' => $password,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'regex:'.User::PHONE_REGEX, 'unique:users,phone'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
        ], [
            'phone.regex' => 'Номер телефону має бути у форматі +380XXXXXXXXX.',
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $data = $validator->validated();

        $user = User::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => User::ROLE_SUPER_ADMIN,
            'is_active' => true,
        ]);

        $this->info("Супер адміністратора створено: {$user->name} (телефон для входу: {$user->phone}).");

        return self::SUCCESS;
    }
}
