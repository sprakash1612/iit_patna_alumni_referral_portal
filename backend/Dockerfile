FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    curl zip unzip git libpq-dev libssl-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2.2 /usr/bin/composer /usr/bin/composer
ENV COMPOSER_MEMORY_LIMIT=-1
WORKDIR /app

# Copy all files first so composer autoloader can scan app/ directories
COPY . .

# Create required Laravel directories before composer runs
RUN mkdir -p bootstrap/cache \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    && chmod -R 777 bootstrap/cache storage

# --no-scripts prevents post-autoload-dump from running package:discover at build time
RUN composer install --no-dev --no-scripts --optimize-autoloader --no-interaction

EXPOSE 8000

CMD php artisan package:discover --ansi \
    && php artisan migrate --force \
    && php artisan serve --host=0.0.0.0 --port=8000
