# BgituQuizz — Квиз-платформа

![Docker Compose](https://img.shields.io/badge/docker--compose-ready-blue?logo=docker)
![Python](https://img.shields.io/badge/python-3.10-blue?logo=python)
![Node.js](https://img.shields.io/badge/nodejs-18-green?logo=node.js)

<!-- Стек -->
![Django](https://img.shields.io/badge/Django-4.2-green?logo=django)
![Django REST](https://img.shields.io/badge/DRF-REST%20Framework-red?logo=django)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-green?logo=fastapi)
![Transformers](https://img.shields.io/badge/Transformers-HuggingFace-yellow?logo=huggingface)
![Torch](https://img.shields.io/badge/PyTorch-2.2.2-orange?logo=pytorch)
![Express](https://img.shields.io/badge/Express-4.18.2-black?logo=express)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7.5-black?logo=socket.io)
![Telegram](https://img.shields.io/badge/Telegram-Bot-blue?logo=telegram)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwindcss&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?logo=chartdotjs)

---

## Скриншоты

<p align="center">
  <img src="https://github.com/user-attachments/assets/c59cb4b9-cb21-45dd-930d-af50b40fd043" alt="Админ-панель" width="350" style="margin: 0 10px;"/>
  <img src="https://github.com/user-attachments/assets/a1c8cdec-f9a6-4abf-a7f2-901553732146" alt="Основная платформа" width="350" style="margin: 0 10px;"/>
  <img src="https://github.com/user-attachments/assets/4259f8ca-f905-42a6-9124-87869b420f15" alt="Telegram-бот" width="350" style="margin: 0 10px;"/>
</p>


<p align="center">
  <b>Админ-панель</b> &nbsp;&nbsp;&nbsp;&nbsp; <b>Основная платформа</b> &nbsp;&nbsp;&nbsp;&nbsp; <b>Telegram-бот</b>
</p>

---

---

## Видео демонстрация проекта

![Ссылка на Яндекс.Диск](https://disk.360.yandex.ru/i/RxbDO6-6ADEKxg)

---

Многоуровневая платформа для проведения квизов с поддержкой:
- Веб-админки (Django)
- ML-сервиса (FastAPI)
- Игрового сервера (Node.js + Socket.io)
- Telegram-бота (aiogram)
- Хранения сессий через Redis

---

## Архитектура

```
┌────────────┐      ┌────────────┐      ┌────────────┐      ┌────────────┐
│  Django    │<---->│   ML API   │<---->│  Node.js   │<---->│  Redis     │
│  Admin/API │      │  FastAPI   │      │  GameSrv   │      │  Session   │
└────────────┘      └────────────┘      └────────────┘      └────────────┘
      │                   │                   │                   │
      │                   │                   │                   │
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
  Telegram Bot      Веб-клиенты         Игроки/Хосты         Postgres
```

- **Django** — админка, REST API, хранение квизов и шагов, интеграция с ML API
- **ML API** — генерация вопросов, сентимент-анализ, анти-мат, проверка открытых ответов
- **Node.js** — игровой сервер, Socket.io, хранение сессий в Redis
- **Telegram Bot** — квиз в Telegram, динамика через API
- **Redis** — хранение сессий Socket.io
- **Postgres** — основная БД

---

## Быстрый старт

1. **Клонируйте репозиторий:**
   ```bash
   git clone <your-repo-url>
   cd <your-repo>
   ```

2. **Создайте .env-файлы (по необходимости):**
   - Для Django, ML, Node, TG — переменные можно задать через docker-compose или .env

3. **Запустите всё через Docker Compose:**
   ```bash
   docker-compose up --build
   ```

4. **Доступы:**
   - Django Admin: [http://localhost:8000/admin/](http://localhost:8000/admin/)
   - ML API: [http://localhost:8001/docs](http://localhost:8001/docs)
   - Игровой сервер: [http://localhost:3000/](http://localhost:3000/)
   - Telegram-бот: [@your_bot](https://t.me/your_bot)

---

## Переменные окружения (пример)

- **Django/ML/Node/TG**:
  - `ADMIN_API_URL=http://django:8000/api/active_game/`
  - `ML_API_URL=http://ml:8001`
  - `OPEN_ANSWER_THRESHOLD=0.7`
  - `TG_API_TOKEN=your_token`
  - `REDIS_HOST=redis`
  - `REDIS_PORT=6379`

- **Postgres**:
  - `POSTGRES_DB=bgituquizz`
  - `POSTGRES_USER=bgituquizzuser`
  - `POSTGRES_PASSWORD=bgituquizzpass`

---

## Основные команды

- **Сборка и запуск:**
  ```bash
  docker-compose up --build
  ```
- **Остановка:**
  ```bash
  docker-compose down
  ```
- **Миграции Django:**
  ```bash
  docker-compose exec django python manage.py migrate
  ```

---

## Примеры API

- **Получить активную игру:**
  ```http
  GET /api/active_game/
  ```
- **Проверка открытого ответа:**
  ```http
  POST /check_open_answer
  { "answer": "Москва", "reference": "Столица России" }
  ```
- **Проверка на ругательства:**
  ```http
  POST /analyze_swear
  { "text": "блин, фигня" }
  ```

---

## Лицензия

MIT 
