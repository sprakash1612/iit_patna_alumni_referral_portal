FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    curl zip unzip git libpq-dev libssl-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Step 1: Bootstrap a complete Laravel 11 installation (gives us artisan, public/, bootstrap/ etc.)
RUN composer create-project laravel/laravel . "^11.0" --prefer-dist --no-interaction

# Step 2: Overlay our custom application files on top of the fresh install
COPY . .

# Step 3: Run package discovery now that artisan exists
RUN php artisan package:discover --ansi

# Step 4: Cache for production
RUN php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache

EXPOSE 8000

CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000
