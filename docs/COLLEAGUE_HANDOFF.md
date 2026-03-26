# CLP Label Tool: Colleague Handoff

## 1. Что это за проект

Это внутренний генератор CLP-этикеток для `AROMA + WAX`.

Приложение:
- берет товары и варианты из Shopify
- читает `clp` metafields
- дает выбрать шаблон этикетки
- показывает HTML preview
- печатает через браузер или сохраняет через `Save as PDF`

Текущий хостинг-план:
- production URL: `labels.aromawax.eu`
- deployment target: `Vercel`

## 2. Что уже реализовано

- приватный вход по паролю
- серверный Shopify GraphQL Admin API клиент
- поиск товаров
- выбор варианта
- приоритет variant metafields над product metafields
- шаблоны:
  - `candle`
  - `diffuser`
  - `room_spray`
- print CSS
- mock-режим без Shopify
- bootstrap-скрипт для `clp` metafield definitions

## 3. Структура проекта

- `app/page.tsx`
  - главный экран приложения
- `app/api/products/route.ts`
  - API route для чтения товаров из Shopify
- `components/clp-tool.tsx`
  - основной UI генератора
- `components/label-preview.tsx`
  - рендер этикетки
- `lib/shopify.ts`
  - Shopify GraphQL Admin API клиент
- `lib/mock-data.ts`
  - локальные mock-продукты
- `scripts/bootstrap-metafields.ts`
  - создание metafield definitions в Shopify
- `README.md`
  - короткий setup

## 4. Что нужно получить от бизнеса/команды

До финального production запуска нужны:

- Shopify store domain в формате `*.myshopify.com`
- доступ к Shopify Dev Dashboard
- app development permissions
- список реальных размеров этикеток в мм
- финальные CLP-данные для товаров
- решение, кто и как будет заполнять `clp` metafields
- доступ к Vercel проекту
- доступ к DNS в GoDaddy

## 5. Какие Shopify scopes нужны

Минимум:

- `read_products`

Если запускать bootstrap definitions:

- `write_products`

Рекомендуемый набор для этого проекта:

- `read_products`
- `write_products`

## 6. Какие переменные окружения нужны

Файл: `.env.local`

### Вариант 1. Рекомендуемый

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_CLIENT_ID=1234567890abcdef1234567890abcdef
SHOPIFY_CLIENT_SECRET=abcdef1234567890abcdef1234567890
APP_PASSWORD=very-strong-internal-password
USE_MOCK_DATA=0
```

### Вариант 2. Через готовый access token

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
APP_PASSWORD=very-strong-internal-password
USE_MOCK_DATA=0
```

### Только для локальной демонстрации

```env
APP_PASSWORD=demo-password
USE_MOCK_DATA=1
```

## 7. Как получить Shopify credentials

1. Открыть [https://dev.shopify.com/](https://dev.shopify.com/)
2. Перейти в `Apps`
3. Нажать `Create app`
4. Выбрать `Start from Dev Dashboard`
5. Назвать приложение, например `AROMA CLP Labels`
6. Открыть вкладку `Versions`
7. Создать версию
8. Выбрать scopes:
   - `read_products`
   - `write_products`
9. Нажать `Release`
10. Перейти на `Home`
11. Нажать `Install app`
12. Установить app на нужный магазин
13. Перейти в `Settings`
14. Скопировать:
   - `Client ID`
   - `Client secret`

Если используете старый токеновый путь внутри вашей инфраструктуры, нужен:

- `SHOPIFY_ACCESS_TOKEN`

Но для этого проекта лучше держаться client credentials flow.

## 8. Локальный запуск с нуля

Из корня проекта:

```bash
cp .env.example .env.local
```

Заполнить `.env.local`.

Установить зависимости:

```bash
npm install
```

Запустить dev server:

```bash
npm run dev
```

Открыть:

- `http://localhost:3000`

## 9. Как проверить mock-режим

В `.env.local`:

```env
APP_PASSWORD=demo-password
USE_MOCK_DATA=1
```

Потом:

```bash
npm install
npm run dev
```

Что должно быть:

- открывается логин
- после пароля загружаются mock-товары
- доступны 3 шаблона
- preview обновляется
- `Print` открывает чистую печать

## 10. Как включить живой Shopify

В `.env.local`:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_CLIENT_ID=...
SHOPIFY_CLIENT_SECRET=...
APP_PASSWORD=...
USE_MOCK_DATA=0
```

Далее:

```bash
npm run shopify:bootstrap
npm run dev
```

Проверить:

- в поиске есть реальные товары
- вариант можно переключать
- данные CLP подхватываются из Shopify

## 11. Как заполняются CLP данные

Namespace:

- `clp`

Ключи:

- `clp.template_type`
- `clp.signal_word`
- `clp.contains`
- `clp.h_statements`
- `clp.p_statements`
- `clp.euh_statements`
- `clp.pictograms`
- `clp.net_quantity_default`
- `clp.extra_warning`

Формат:

- `template_type`: строка
  - `candle`
  - `diffuser`
  - `room_spray`
- `signal_word`: строка
- `contains`: JSON array
- `h_statements`: JSON array
- `p_statements`: JSON array
- `euh_statements`: JSON array
- `pictograms`: JSON array
- `net_quantity_default`: строка
- `extra_warning`: текст

Пример:

```json
["H317 May cause an allergic skin reaction.", "H412 Harmful to aquatic life with long lasting effects."]
```

## 12. Как работает приоритет данных

Логика уже реализована:

- если значение есть на variant, используется оно
- если на variant пусто, берется значение с product

Это важно для случаев, когда CLP зависит от размера/варианта.

## 13. Как задеплоить на Vercel

1. Создать новый проект в Vercel
2. Подключить GitHub repo
3. Импортировать проект
4. Добавить env vars:
   - `SHOPIFY_STORE_DOMAIN`
   - `SHOPIFY_CLIENT_ID`
   - `SHOPIFY_CLIENT_SECRET`
   - `APP_PASSWORD`
   - `USE_MOCK_DATA=0`
5. Нажать `Deploy`
6. Проверить домен вида `project-name.vercel.app`

## 14. Как подключить `labels.aromawax.eu`

В Vercel:

1. Открыть проект
2. `Settings` -> `Domains`
3. Добавить `labels.aromawax.eu`
4. Скопировать DNS target

В GoDaddy:

1. Открыть DNS зоны `aromawax.eu`
2. Создать запись:
   - Type: `CNAME`
   - Name: `labels`
   - Value: target из Vercel
3. Сохранить
4. Дождаться распространения DNS
5. Проверить статус домена в Vercel

## 15. Что еще нужно сделать до финала

Обязательно:

- завести GitHub repo и выложить код
- подключить реальные Shopify credentials
- создать `clp` metafield definitions
- наполнить реальные `clp` metafields
- проверить печать на реальной бумаге/наклейках
- уточнить финальные размеры этикеток
- при необходимости заменить текстовые пиктограммы на настоящие GHS-иконки

Желательно:

- добавить logout
- добавить более точные size presets
- добавить отдельные пресеты под конкретные банки/бутылки
- добавить export/import для шаблонов

## 16. Как понять, что проект готов

Чеклист:

- `npm run build` проходит
- локально работает логин
- mock-режим работает
- живой Shopify режим работает
- CLP metafields читаются
- variant override работает
- print preview чистый
- `Save as PDF` дает аккуратную этикетку
- deployment на Vercel открывается
- `labels.aromawax.eu` указывает на Vercel

## 17. Что делать, если что-то не работает

Если нет товаров:

- проверить `SHOPIFY_STORE_DOMAIN`
- проверить scopes
- проверить установлено ли приложение на store
- проверить `USE_MOCK_DATA`

Если не создаются metafields:

- проверить `write_products`
- проверить корректность credentials

Если не печатает красиво:

- тестировать через Chrome
- использовать `Save as PDF`
- отключить browser headers/footers в print dialog
- проверить реальный paper size на принтере
