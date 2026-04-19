# Журнал ежедневного допуска к работе

## Обзор

Добавлен новый компонент `DailyWorkJournal` - официальная таблица в стиле бумажного журнала для регистрации ежедневных инструктажей и завершения работ.

---

## Компонент: DailyWorkJournal

**Файл:** `src/app/components/permit/DailyWorkJournal.tsx`

### Основные характеристики

✅ **Официальный табличный формат** - строгий промышленный стиль  
✅ **Двухуровневая шапка** - группировка колонок с четким разделением  
✅ **Минимализм** - без карточек, только таблица с границами  
✅ **Фиксированная шапка** - для работы с большим количеством записей  
✅ **Статусная индикация** - визуальное отображение состояния дней  

---

## Структура таблицы

### Верхний уровень шапки (colspan группы)

**Левая часть:**  
"Проведен инструктаж бригаде и осуществлен допуск на подготовленное рабочее место"

**Правая часть:**  
"Работа окончена, бригада с рабочего места выведена"

### Нижний уровень шапки (колонки)

**Левая секция (допуск):**
1. № — номер дня
2. Наименование места работы
3. Дата, время
4. Допускающий (подпись)
5. Произв./Набл. (подпись)
6. Члены бригады (подписи)

**Правая секция (окончание):**
1. Дата, время окончания
2. Подпись

---

## UX поведение

### Добавление дней

- Кнопка "Добавить день" доступна только если:
  - Пользователь — Допускающий
  - Статус наряда позволяет добавление
  - Предыдущий день завершён (или это первый день)

- При нажатии "Добавить день":
  - Открывается inline-форма прямо в таблице
  - Поля: место работы, дата/время
  - Кнопки: "Создать запись" / "Отмена"

### Состояния строк

**1. Активный день** (фон: светло-голубой)
- Инструктаж подписан
- Работы ведутся
- Окончание не подписано

**2. Завершённый день** (фон: светло-зелёный)
- Все подписи получены
- Окончание подписано
- День закрыт

**3. Ожидание подписей** (фон: белый)
- Запись создана
- Ожидаются подписи

### Подписи

**Статусы отображения:**

✔️ **Подписано** (зелёная галочка)
- Отображается время подписи
- Формат: DD.MM HH:MM

⏳ **Ожидается** (жёлтая иконка часов)
- Подпись требуется, но не получена

— **Не требуется** (прочерк)
- Для закрытых/аннулированных нарядов
- Для членов бригады (не первый день)

### Кнопки действий

**"Подписать"** — для допускающего/ответственного
- Отображается когда подпись ожидается
- Вызывает процесс подписания ЭЦП

**"Завершить"** — для окончания дня
- Доступна когда введено время окончания
- Все инструктажные подписи получены

**"ЭЦП"** — для членов бригады
- Только в первый день
- Inline-кнопка рядом с именем

---

## Логика работы

### Создание первого дня

```
1. Допускающий нажимает "Добавить первый день"
   ↓
2. Заполняет место работы и дату/время
   ↓
3. Нажимает "Создать запись"
   ↓
4. Запись добавлена, статус: ожидание подписей
```

### Подписание допуска

```
1. Допускающий подписывает инструктаж
   ↓
2. Производитель/Наблюдающий подписывает
   ↓
3. Члены бригады подписывают (только 1-й день!)
   ↓
4. Статус: активный день
```

### Завершение дня

```
1. Производитель/Наблюдающий вводит время окончания
   ↓
2. Нажимает "Завершить"
   ↓
3. Подписывает ЭЦП
   ↓
4. Статус: завершённый день
   ↓
5. Кнопка "Добавить день" разблокирована
```

### Добавление следующего дня

```
Условие: предыдущий день завершён

1. Допускающий нажимает "Добавить день"
   ↓
2. Заполняет данные
   ↓
3. Создаёт запись
   ↓
4. Цикл повторяется (без подписей бригады)
```

---

## Визуальный стиль

### Цветовая схема

- **Границы:** тёмно-серые (`border-gray-300`, `border-gray-400`)
- **Шапка уровень 1:** светло-серый фон (`bg-gray-100`)
- **Шапка уровень 2:** очень светлый фон (`bg-gray-50`)
- **Активная строка:** светло-голубой (`bg-blue-50/20`)
- **Завершённая строка:** светло-зелёный (`bg-emerald-50/30`)
- **Форма добавления:** светло-голубой (`bg-blue-50`, `border-blue-300`)

### Типографика

- **Заголовки:** uppercase, tracking-wide, font-bold
- **Колонки:** uppercase, text-[10px], font-semibold
- **Данные:** text-xs, font-mono (для дат)
- **Статусы:** text-[9px] - text-[10px]

### Размеры колонок

```typescript
№                → w-12   (48px)
Место работы     → w-48   (192px)
Дата, время      → w-32   (128px)
Допускающий      → w-32   (128px)
Произв./Набл.    → w-32   (128px)
Члены бригады    → w-40   (160px)
Дата окончания   → w-32   (128px)
Подпись          → w-32   (128px)

Минимальная ширина таблицы: 1200px
```

---

## Footer (подвал таблицы)

**Содержимое:**

- **Всего дней:** общее количество записей
- **Завершено:** количество дней с подписью окончания (зелёный)
- **В процессе:** количество активных дней (голубой)

**Предупреждение:**  
При попытке добавить день без завершения текущего:
```
⚠️ Завершите текущий день перед добавлением нового
```

---

## Легенда (условные обозначения)

Отображается под таблицей:

- ✔️ Подписано (зелёная галочка)
- ⏳ Ожидается (жёлтые часы)
- 🟦 Активный день (голубой квадрат)
- 🟩 Завершённый день (зелёный квадрат)

---

## Технические детали

### Props интерфейс

```typescript
interface Props {
  briefings: DailyBriefing[];           // Список инструктажей
  brigadeMembers: BrigadeMember[];      // Члены бригады
  currentUser: User;                    // Текущий пользователь
  observerId?: string;                  // ID наблюдающего
  permitStatus: string;                 // Статус наряда
  canAddBriefing: boolean;              // Может добавлять дни
  canSignAdmitter: boolean;             // Может подписывать (допускающий)
  canSignResponsible: boolean;          // Может подписывать (ответственный)
  canSignMember: boolean;               // Может подписывать (член бригады)
  canEndWork: boolean;                  // Может завершать день
  
  // Callbacks
  onAddBriefing: (location: string, dateTime: string) => void;
  onSignAdmitter: (briefingId: string) => void;
  onSignResponsible: (briefingId: string) => void;
  onSignMember: (briefingId: string, memberId: string, memberName: string) => void;
  onEndWork: (briefingId: string, endDateTime: string) => void;
}
```

### Внутренний state

```typescript
const [editingRow, setEditingRow] = useState<string | null>(null);
const [newLocation, setNewLocation] = useState('');
const [newDateTime, setNewDateTime] = useState(new Date().toISOString().slice(0, 16));
const [endDateTimes, setEndDateTimes] = useState<Record<string, string>>({});
```

### Вспомогательные функции

**getRowStatus** - определение статуса строки:
```typescript
type RowStatus = 'active' | 'completed' | 'pending';

function getRowStatus(briefing: DailyBriefing, permitStatus: string): RowStatus {
  if (briefing.endSignature) return 'completed';
  if (briefing.admitterSignature && briefing.responsibleSignature) return 'active';
  return 'pending';
}
```

**SignStatus** - компонент отображения статуса подписи:
```typescript
function SignStatus({ 
  status: 'signed' | 'pending' | 'not_required', 
  timestamp?: string 
})
```

---

## Интеграция в систему

### Использование в WorkPermitDetail

Компонент заменяет `DailyBriefingTable` на вкладке "Инструктажи":

```tsx
<DailyWorkJournal
  briefings={permit.dailyBriefings}
  brigadeMembers={permit.brigadeMembers}
  currentUser={currentUser}
  observerId={permit.observerId}
  permitStatus={S}
  canAddBriefing={isAdmitter && ['workplace_approved', 'in_progress', 'daily_ended'].includes(S)}
  canSignAdmitter={isAdmitter && !!permit.dailyBriefings.find(b => !b.admitterSignature)}
  canSignResponsible={(isForeman || isObserver)}
  canSignMember={isMember}
  canEndWork={isForeman || isObserver}
  onAddBriefing={(location, dateTime) => {
    const brief: DailyBriefing = {
      id: `db_${Date.now()}`,
      isFirst: permit.dailyBriefings.length === 0,
      workLocationName: location,
      briefingDateTime: dateTime,
      brigadeSignatures: [],
    };
    ctx.createBriefing(permit.id, brief);
    pushToast('Новый день добавлен', 'success', 'Запись создана');
  }}
  onSignAdmitter={(briefingId) => {
    ctx.signBriefingAdmitter(permit.id, briefingId, makeSig());
    pushToast('Инструктаж подписан (Допускающий)', 'success');
  }}
  onSignResponsible={(briefingId) => {
    ctx.signBriefingResponsible(permit.id, briefingId, makeSig());
    pushToast('Инструктаж подтверждён', 'success');
  }}
  onSignMember={(briefingId, memberId, memberName) => {
    ctx.signBriefingMember(permit.id, briefingId, memberId, memberName, makeSig());
    pushToast(`Инструктаж подтверждён: ${memberName}`, 'success');
  }}
  onEndWork={(briefingId, endDateTime) => {
    ctx.endDailyWork(permit.id, briefingId, new Date(endDateTime).toISOString(), makeSig());
    pushToast('Ежедневные работы завершены', 'success');
  }}
/>
```

---

## Преимущества нового компонента

### По сравнению с DailyBriefingTable

✅ **Официальный вид** - точная имитация бумажного журнала  
✅ **Двухуровневая шапка** - чёткая группировка логических блоков  
✅ **Табличная структура** - без карточек, строгая сетка  
✅ **Inline редактирование** - добавление дня прямо в таблице  
✅ **Статусная раскраска** - визуальное разделение состояний  
✅ **Footer с метриками** - быстрая сводка по дням  
✅ **Легенда** - понятные обозначения для пользователя  
✅ **Минимализм** - только необходимое, никаких излишеств  

---

## Пример данных

```typescript
// Пример записи завершённого дня
{
  id: "db_1",
  isFirst: true,
  workLocationName: "РУ-10кВ Подстанция №5",
  briefingDateTime: "2026-04-17T08:00:00.000Z",
  admitterSignature: { userId: "u3", userName: "Петров П.П.", ... },
  responsibleSignature: { userId: "u7", userName: "Козлов К.К.", ... },
  brigadeSignatures: [
    { memberId: "bm1", memberName: "Рабочий А.А.", sig: {...} },
    { memberId: "bm2", memberName: "Рабочий Б.Б.", sig: {...} }
  ],
  endDateTime: "2026-04-17T18:00:00.000Z",
  endSignature: { userId: "u7", userName: "Козлов К.К.", ... }
}

// Пример активного дня (второй день)
{
  id: "db_2",
  isFirst: false,
  workLocationName: "РУ-10кВ Подстанция №5",
  briefingDateTime: "2026-04-18T08:00:00.000Z",
  admitterSignature: { userId: "u3", userName: "Петров П.П.", ... },
  responsibleSignature: { userId: "u7", userName: "Козлов К.К.", ... },
  brigadeSignatures: [],  // Не требуются во второй день
  endDateTime: undefined,  // Работы продолжаются
  endSignature: undefined
}
```

---

## Итоги

Компонент `DailyWorkJournal` полностью реализует требования:

✅ Официальная таблица в стиле бумажного журнала  
✅ Двухуровневая шапка с группировкой колонок  
✅ Строгий промышленный стиль (минимализм, границы, сетка)  
✅ Inline-форма добавления дней  
✅ Статусная индикация (активный/завершённый/ожидание)  
✅ Валидация: нельзя добавить день без завершения текущего  
✅ Footer с метриками и предупреждениями  
✅ Легенда для понимания обозначений  
✅ Поддержка большого количества записей  

Таблица максимально приближена к формату официального бумажного журнала допуска с сохранением современного UX.
