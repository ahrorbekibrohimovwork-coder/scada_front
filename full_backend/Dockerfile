FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Сначала копируем только файл с зависимостями
# (Это ускоряет сборку, так как Docker кэширует слои)
COPY requirements.txt .

# Устанавливаем все нужные библиотеки из твоего списка
RUN pip install --no-cache-dir -r requirements.txt

# Копируем остальной код проекта
COPY . .

# Открываем порт 8000 (так как в docker-compose указан 8000)
EXPOSE 8000

# Запускаем через uvicorn (убедись, что файл называется main.py и объект FastAPI в нем — app)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]