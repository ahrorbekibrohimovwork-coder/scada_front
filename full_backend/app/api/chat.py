import os
import httpx
import openpyxl
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_default_excel = os.path.join(BASE_DIR, '..', '..', '..', 'analiz_datas', 'ToshkentGes.xlsx')
EXCEL_PATH = os.getenv('EXCEL_PATH', _default_excel)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:latest")


def load_ges_data() -> str:
    """Parse Excel and return readable text summary for the LLM context."""
    try:
        wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))

        # Row index 1 = headers, rows 2-5 = GES data (0-indexed)
        headers = rows[1]
        ges_rows = rows[2:7]

        lines = []
        for row in ges_rows:
            if not row[0]:
                continue
            name = row[0]
            capacity = row[1]
            plan = row[2]
            temp = row[3]
            pressure = row[4]
            inflow = row[5]
            outflow = row[7]
            ges_flow = row[8]
            total_units = row[11]
            working_units = row[12]
            power = row[13]
            daily_energy = row[15]
            month_energy = row[17]
            year_energy = row[18]
            plan_pct = row[19]
            plan_diff = row[20]

            lines.append(
                f"- {name}: "
                f"Установленная мощность {capacity} МВт, план (янв-апр) {plan} млн.кВт·ч | "
                f"Температура {temp}°C, давление воды {pressure} м | "
                f"Приток {inflow} м³/с, сброс через ГЭС {ges_flow} м³/с | "
                f"Агрегатов всего {total_units}, работает {working_units}, мощность {power} МВт | "
                f"Выработка за сутки {daily_energy} млн.кВт·ч, "
                f"за месяц {month_energy} млн.кВт·ч, "
                f"за год {year_energy} млн.кВт·ч | "
                f"Выполнение плана {plan_pct}%, отклонение {plan_diff}"
            )

        return "\n".join(lines)
    except Exception as e:
        return f"Ошибка чтения данных: {e}"


SYSTEM_PROMPT = """Ты — умный помощник диспетчера гидроэлектростанций (ГЭС) компании «Узгидроэнерго».
Ты анализируешь оперативные данные по Ташкентскому каскаду ГЭС и отвечаешь на вопросы на русском языке.
Будь конкретным, давай чёткие выводы: норма ли показатели, есть ли отклонения, что нужно учесть.
Если вопрос не связан с ГЭС или энергетикой — вежливо переведи разговор в профессиональное русло.

Текущие оперативные данные (14 апреля 2026 г.):
{data}
"""


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


@router.post("/chat")
async def chat(req: ChatRequest):
    ges_data = load_ges_data()
    system = SYSTEM_PROMPT.format(data=ges_data)

    messages = [{"role": "system", "content": system}]
    for msg in req.history[-10:]:  # last 10 messages for context
        messages.append(msg)
    messages.append({"role": "user", "content": req.message})

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False},
        )
        resp.raise_for_status()
        data = resp.json()

    reply = data["message"]["content"]
    return {"reply": reply}
