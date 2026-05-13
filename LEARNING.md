# 📚 NestJS — Навчальний конспект

> Цей файл — твій особистий конспект по NestJS. Він росте разом з проєктом.
> Кожна нова концепція пояснюється на прикладах з твого Express-коду.

---

## Зміст

1. [Що таке NestJS і навіщо він](#1-що-таке-nestjs-і-навіщо-він)
2. [Декоратори — що таке @ в TypeScript](#2-декоратори--що-таке--в-typescript)
3. [Архітектура NestJS — як все зв'язано](#3-архітектура-nestjs--як-все-звязано)
4. [Модулі (@Module)](#4-модулі-module)
5. [Контролери (@Controller)](#5-контролери-controller)
6. [Сервіси (@Injectable) та Dependency Injection](#6-сервіси-injectable-та-dependency-injection)
7. [Як NestJS обробляє HTTP-запит](#7-як-nestjs-обробляє-http-запит)
8. [Порівняння: Express vs NestJS — повна таблиця](#8-порівняння-express-vs-nestjs--повна-таблиця)

---

## 1. Що таке NestJS і навіщо він

**NestJS** — це фреймворк для Node.js, побудований поверх Express (або Fastify).

### Чому не просто Express?

Express — це мінімальний фреймворк. Він дає тобі `app.get()`, `app.post()` — і все. Як організувати код, де ставити middleware, як робити DI — це все на тобі.

**Проблема**: коли проєкт росте, Express-код стає хаотичним. Кожен розробник структурує по-своєму.

**NestJS вирішує це**, даючи:
- ✅ **Чітку архітектуру** (модулі, контролери, сервіси)
- ✅ **Dependency Injection** (автоматичне підключення залежностей)
- ✅ **Декоратори** (менше бойлерплейту)
- ✅ **Вбудовану обробку помилок** (не потрібен `asyncHandler`)
- ✅ **Модульність** (кожна фіча ізольована)

### Аналогія

Якщо **Express** — це лего-кубики (збирай як хочеш), то **NestJS** — це лего-набір з інструкцією (є правильна структура, але можна кастомізувати).

---

## 2. Декоратори — що таке @ в TypeScript

Декоратори — це **функції, які додають метадані до класів, методів чи параметрів**. Символ `@` — це просто синтаксис для їх виклику.

### Простий приклад

```typescript
// Без декоратора
class Cat {
  name: string;
}

// З декоратором
@Injectable()   // ← це декоратор. Він каже NestJS: "цей клас можна інжектити"
class CatService {
  name: string;
}
```

### Що робить декоратор під капотом?

```typescript
// @Injectable() — це по суті виклик функції, яка робить щось таке:
function Injectable() {
  return function(target: any) {
    // Зберігає метадані: "цей клас — провайдер NestJS"
    Reflect.defineMetadata('injectable', true, target);
  }
}
```

Тобі не потрібно знати як вони працюють всередині — достатньо знати **які декоратори існують і що вони роблять**:

### Декоратори, які ти будеш використовувати

| Декоратор | Де ставиться | Що робить |
|---|---|---|
| `@Module({...})` | Клас | Позначає клас як NestJS-модуль |
| `@Controller('path')` | Клас | Позначає клас як контролер (обробник HTTP) |
| `@Injectable()` | Клас | Позначає клас як сервіс (можна інжектити) |
| `@Get()` | Метод | Цей метод обробляє GET-запити |
| `@Post()` | Метод | Цей метод обробляє POST-запити |
| `@Put()` | Метод | Цей метод обробляє PUT-запити |
| `@Delete()` | Метод | Цей метод обробляє DELETE-запити |
| `@Param('id')` | Параметр | Дістає параметр з URL (`req.params.id`) |
| `@Body()` | Параметр | Дістає тіло запиту (`req.body`) |
| `@UseGuards()` | Клас/Метод | Додає guard (аналог middleware) |

### Приклад — Express vs NestJS

```typescript
// ===== EXPRESS (твій поточний код) =====

// Роутинг — окремий файл routes/board.routes.ts
router.get('/:id', authorizeBoard, getBoardById);

// Контролер — окремий файл controllers/board.controller.ts
export const getBoardById = asyncHandler(async (req: Request, res: Response) => {
  const boardId = parseInt(req.params.id);   // дістаємо параметр вручну
  const board = await boardService.findByIdAndOwner(boardId, req.user.userId);
  res.status(200).json({ board });
});
```

```typescript
// ===== NESTJS (як буде) =====

// Все в ОДНОМУ файлі — board.controller.ts
@Controller('boards')
@UseGuards(JwtAuthGuard)          // замість router.use(authMiddleware)
export class BoardController {
  constructor(private boardService: BoardService) {}  // DI замість import

  @Get(':id')
  @UseGuards(BoardOwnerGuard)     // замість authorizeBoard middleware
  getBoardById(
    @Param('id', ParseIntPipe) id: number,   // автоматично парсить в number!
    @CurrentUser() user: JwtPayload          // замість req.user
  ) {
    return this.boardService.findByIdAndOwner(id, user.userId);
    // NestJS автоматично робить res.json() і ставить статус 200!
  }
}
```

**Зверни увагу:**
- Не потрібен `asyncHandler` — NestJS ловить помилки сам
- Не потрібен `parseInt(req.params.id)` — `ParseIntPipe` робить це автоматично
- Не потрібен `res.status(200).json(...)` — просто `return` об'єкт
- Роутинг описаний прямо тут же декораторами, а не в окремому файлі

---

## 3. Архітектура NestJS — як все зв'язано

```
┌─────────────────────────────────────────────────┐
│                   AppModule                      │
│  (кореневий модуль — збирає все докупи)          │
│                                                  │
│  imports: [                                      │
│    ConfigModule,     ← конфігурація (.env)       │
│    DatabaseModule,   ← підключення до БД         │
│    AuthModule,       ← login/register/JWT        │
│    BoardModule,      ← CRUD дошок                │
│    ListModule,       ← CRUD списків              │
│    CardModule,       ← CRUD карток               │
│  ]                                               │
└─────────────────────────────────────────────────┘

Кожен модуль всередині:
┌─────────────────────────────────────────┐
│            BoardModule                   │
│                                          │
│  controllers: [BoardController]          │
│       ↓ використовує                     │
│  providers: [BoardService]               │
│       ↓ використовує                     │
│  imports: [DatabaseModule]  ← БД         │
└─────────────────────────────────────────┘
```

### В Express у тебе (по суті те саме, але без формальної структури):

```
index.ts (усе підключається вручну)
  ├── app.use('/api/boards', boardRoutes)    ← роутинг
  ├── app.use('/api/lists', listRoutes)
  └── app.use('/api/cards', cardRoutes)

routes/board.routes.ts → controllers/board.controller.ts → services/board.service.ts
```

**Різниця**: В Express ти сам вирішуєш як організувати код. В NestJS є чітка конвенція: Module → Controller → Service.

---

## 4. Модулі (@Module)

**Модуль** — це клас з декоратором `@Module()`, який **групує пов'язаний код**.

### Навіщо модулі?

В Express у тебе в `index.ts` підключається ВСЕ:

```typescript
// Express — index.ts — все в одному місці
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);
```

В NestJS кожна фіча — **ізольований модуль**:

```typescript
// NestJS — board.module.ts
@Module({
  imports: [DatabaseModule],           // що цей модуль потребує
  controllers: [BoardController],      // HTTP-обробники
  providers: [BoardService],           // бізнес-логіка
  exports: [BoardService],            // що цей модуль віддає іншим
})
export class BoardModule {}
```

А потім кореневий `AppModule` збирає все:

```typescript
// NestJS — app.module.ts
@Module({
  imports: [AuthModule, BoardModule, ListModule, CardModule],
  // І все! NestJS сам підключить роути, сервіси, тощо.
})
export class AppModule {}
```

### Параметри @Module()

| Параметр | Що це | Аналогія з Express |
|---|---|---|
| `imports` | Інші модулі, від яких залежить цей | `require('./db')` |
| `controllers` | Контролери (обробляють HTTP) | `app.use('/api/boards', router)` |
| `providers` | Сервіси (бізнес-логіка) | `import { boardService }` |
| `exports` | Що доступне для інших модулів | `module.exports = {...}` |

---

## 5. Контролери (@Controller)

**Контролер** — це клас, який **обробляє HTTP-запити**. Аналог твоїх `routes/*.ts` + `controllers/*.ts` в одному файлі.

```typescript
@Controller('boards')                      // базовий шлях: /boards
export class BoardController {

  constructor(
    private readonly boardService: BoardService   // DI — автоматично підставляється
  ) {}

  @Get()                                    // GET /boards
  findAll() {
    return this.boardService.findAll();
    // NestJS автоматично:
    // 1. Серіалізує результат в JSON
    // 2. Ставить статус 200
    // 3. Відправляє відповідь
  }

  @Get(':id')                               // GET /boards/123
  findOne(@Param('id') id: string) {
    return this.boardService.findOne(+id);   // +id = parseInt
  }

  @Post()                                   // POST /boards
  @HttpCode(201)                            // статус 201 замість дефолтного 200
  create(@Body() body: CreateBoardDto) {
    return this.boardService.create(body);
  }

  @Put(':id')                               // PUT /boards/123
  update(@Param('id') id: string, @Body() body: UpdateBoardDto) {
    return this.boardService.update(+id, body);
  }

  @Delete(':id')                            // DELETE /boards/123
  remove(@Param('id') id: string) {
    return this.boardService.remove(+id);
  }
}
```

### Декоратори параметрів — заміна req.params, req.body, req.query

| Express | NestJS | Що робить |
|---|---|---|
| `req.params.id` | `@Param('id') id: string` | Параметр з URL |
| `req.body` | `@Body() body: CreateDto` | Тіло запиту |
| `req.query.search` | `@Query('search') search: string` | Query-параметр |
| `req.headers.authorization` | `@Headers('authorization') auth: string` | Заголовок |
| `req.user` | `@CurrentUser() user: JwtPayload` | Кастомний декоратор (створимо) |

---

## 6. Сервіси (@Injectable) та Dependency Injection

### Що таке Dependency Injection (DI)?

**DI** — це патерн, де об'єкти **не створюють свої залежності самі**, а **отримують їх ззовні**.

#### Без DI (як зараз в Express):

```typescript
// services/board.service.ts
import { db } from '../db';      // ← жорстко прив'язаний до конкретної БД

export class BoardService {
  async findAll() {
    return db.select().from(boards);   // використовує глобальний db
  }
}

export const boardService = new BoardService();  // ← створюємо вручну
```

```typescript
// controllers/board.controller.ts
import { boardService } from '../services/board.service';  // ← ручний імпорт

export const getAllBoards = async (req, res) => {
  const boards = await boardService.findAll();  // ← використовуємо напряму
};
```

#### З DI (NestJS):

```typescript
// board.service.ts
@Injectable()   // ← кажемо NestJS: "цей клас — провайдер"
export class BoardService {
  constructor(
    @Inject('DATABASE') private db: DrizzleDB   // ← БД приходить ззовні
  ) {}

  async findAll() {
    return this.db.select().from(boards);
  }
}
// НЕ потрібно робити `new BoardService()` — NestJS зробить сам!
```

```typescript
// board.controller.ts
@Controller('boards')
export class BoardController {
  constructor(
    private readonly boardService: BoardService  // ← NestJS підставить автоматично!
  ) {}

  @Get()
  findAll() {
    return this.boardService.findAll();
  }
}
```

### Навіщо це потрібно?

1. **Тестування** — можна легко замінити реальну БД на мок
2. **Гнучкість** — один сервіс може використовуватись в різних модулях
3. **Lifecycle** — NestJS сам керує створенням і знищенням об'єктів

### Як NestJS знає що підставити?

NestJS дивиться на **тип параметра** в конструкторі:

```typescript
constructor(private boardService: BoardService) {}
//                                 ^^^^^^^^^^^^
// NestJS бачить тип BoardService → шукає провайдер з таким типом
// → знаходить його в providers: [BoardService] модуля
// → створює інстанс і підставляє
```

---

## 7. Як NestJS обробляє HTTP-запит

Коли приходить `GET /api/boards/5` — ось що відбувається:

```
HTTP-запит: GET /api/boards/5
      │
      ▼
┌─ Middleware (якщо є) ──────────────────────┐
│  Аналогічно Express middleware             │
│  (cookie-parser, cors, morgan)             │
└────────────────────────────────────────────┘
      │
      ▼
┌─ Guards (якщо є) ─────────────────────────┐
│  @UseGuards(JwtAuthGuard)                  │
│  Перевіряє: чи є JWT-токен? Чи валідний?   │
│  Якщо ні → 401 Unauthorized               │
│                                             │
│  @UseGuards(BoardOwnerGuard)               │
│  Перевіряє: чи user — власник board?        │
│  Якщо ні → 403 Forbidden                  │
└────────────────────────────────────────────┘
      │
      ▼
┌─ Pipes (якщо є) ──────────────────────────┐
│  @Param('id', ParseIntPipe)                │
│  Перетворює '5' (string) → 5 (number)      │
│                                             │
│  @Body(ZodValidationPipe)                  │
│  Валідує body через Zod-схему              │
│  Якщо невалідне → 400 Bad Request          │
└────────────────────────────────────────────┘
      │
      ▼
┌─ Controller метод ────────────────────────┐
│  getBoardById(id: 5, user: {...})          │
│  return this.boardService.findById(5);     │
└────────────────────────────────────────────┘
      │
      ▼
┌─ Interceptors (якщо є) ──────────────────┐
│  Можуть модифікувати відповідь            │
│  (логування, кешування, трансформація)     │
└────────────────────────────────────────────┘
      │
      ▼
┌─ Exception Filters ──────────────────────┐
│  Якщо на будь-якому етапі кинуто виняток  │
│  → NestJS ловить і повертає JSON-помилку  │
│  throw new NotFoundException('Not found')  │
│  → { statusCode: 404, message: "Not found" }
└────────────────────────────────────────────┘
      │
      ▼
HTTP-відповідь: { "board": {...} }
```

### Порівняння з Express

| Етап | Express (ти пишеш вручну) | NestJS (автоматично) |
|---|---|---|
| Middleware | `app.use(cors())` | `app.enableCors()` в main.ts |
| Auth-перевірка | `authMiddleware` (вручну) | `@UseGuards(JwtAuthGuard)` |
| Авторизація | `authorizeBoard` (вручну) | `@UseGuards(BoardOwnerGuard)` |
| Парсинг params | `parseInt(req.params.id)` + `isNaN` перевірка | `ParseIntPipe` (автоматично) |
| Валідація body | `schema.parse(req.body)` + try/catch | `ZodValidationPipe` (автоматично) |
| Обробка помилок | `asyncHandler` + error handler | Вбудовані Exception Filters |
| Відповідь | `res.status(200).json({...})` | Просто `return {...}` |

---

## 8. Порівняння: Express vs NestJS — повна таблиця

| Концепція | Express (як у тебе) | NestJS (як буде) |
|---|---|---|
| **Entry point** | `src/index.ts` — все вручну | `src/main.ts` — 5 рядків |
| **Організація** | Папки (ти вигадуєш структуру) | Модулі (чітка конвенція) |
| **Роутинг** | `routes/board.routes.ts` (окремий файл) | Декоратори в контролері |
| **Контролер** | Функція з `(req, res)` | Клас з методами |
| **Сервіс** | Клас + ручний export/import | Клас з `@Injectable()` + DI |
| **Middleware** | `app.use(fn)` | Guards, Pipes, Interceptors |
| **Auth** | `authMiddleware` (функція) | `JwtAuthGuard` (клас) |
| **Валідація** | `zodSchema.parse()` в контролері | `ZodValidationPipe` автоматично |
| **Помилки** | `asyncHandler` + error handler | Exception Filters (вбудовано) |
| **Відповідь** | `res.status(200).json({...})` | `return {...}` |
| **Config** | Свій `config/env.ts` з Zod | `@nestjs/config` (ConfigModule) |
| **Swagger** | `swagger-jsdoc` (коментарі) | `@nestjs/swagger` (декоратори) |

---

## 📝 Нотатки по ходу навчання

> Сюди будуть додаватися нові концепції по мірі того, як ми проходимо фази міграції.

### Phase 1 ✅ — Ініціалізація
- Створили проєкт через `@nestjs/cli`
- Зрозуміли базову структуру: `main.ts` → `AppModule` → `Controller` + `Service`

<!-- Phase 2, 3, 4... будуть додані тут -->
4
### Phase 2 ✅: Database Module — Пояснення 🛠️

#### Що ми зробили?
1. Додали `docker-compose.yml` з локальним PostgreSQL (оскільки `.env` не було) і створили `.env`.
2. Скопіювали файли міграцій (`drizzle/`) і саму схему (`src/database/schema.ts`) з Express — **без жодної зміни**.
3. Створили `DatabaseModule`, який замінює `src/db/index.ts` з Express.
4. Налаштували `ConfigModule` для роботи з `.env`.

#### 🧠 Новий концепт: @Global() та Custom Providers

В Express у вас був такий код (`db/index.ts`):
```typescript
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
```
Це робило `db` глобальною змінною.

В NestJS ми використовуємо **Модулі** та **Провайдери**. Ми створили `database.module.ts`:
```typescript
@Global() // 1. Робить модуль доступним скрізь
@Module({
  providers: [
    {
      provide: DATABASE, // 2. "Токен" за яким ми будемо отримувати БД
      inject: [ConfigService], // 3. Беремо налаштування з .env
      useFactory: (configService: ConfigService) => { // 4. "Фабрика", яка створює об'єкт БД
        const connectionString = configService.getOrThrow<string>('DATABASE_URL');
        const client = postgres(connectionString);
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
```

#### 💉 Dependency Injection на практиці

У `app.controller.ts` ми підключили БД:
```typescript
constructor(
  private readonly appService: AppService,
  @Inject(DATABASE) private readonly db: DrizzleDB, // 👈 DI!
) {}
```
Тобто замість ручного імпорту `import { db } from '../db'`, ми кажемо NestJS: "Дай мені об'єкт `DATABASE`", і він сам його підставляє! Це робить код значно легшим для тестування.
### Phase 4 ✅: Board Module — Пояснення 📝

#### 1. Декоратори на рівні класу (Controller)
У `src/board/board.controller.ts` ми застосували декоратор до всього класу:
```typescript
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardController {}
```
Це означає, що **жоден** метод у цьому контролері не спрацює без валідного JWT токена. В Express довелося б додавати `authMiddleware` в кожен `router.get()`, `router.post()` або писати `router.use(authMiddleware)` перед ними.

#### 2. Вбудовані Pipe-и (`ParseIntPipe`) 🔢
В Express, щоб взяти `id` з URL (`/boards/5`), ви писали:
```typescript
const boardId = parseInt(req.params.id);
if (isNaN(boardId)) { ...помилка }
```
У NestJS все це робить `ParseIntPipe`:
```typescript
@Get(':id')
getBoardById(@Param('id', ParseIntPipe) id: number) { ... }
```
NestJS автоматично візьме `id` з URL, перевірить чи це число, перетворить його на `number`, а якщо хтось надішле `/boards/abc` — автоматично видасть помилку `400 Bad Request`.

#### 3. Сервіси та Drizzle 🗄️
`BoardService` повністю інкапсулює логіку роботи з Drizzle ORM. Контролер взагалі не знає, яка база даних використовується. Це дозволяє легко тестувати контролер окремо від бази даних.

#### 4. Swagger `@ApiBearerAuth()` 🔑
Ми додали `@ApiBearerAuth()` над контролером. Завдяки цьому у Swagger (на `http://localhost:3000/api/docs`) з'явився замочок 🔒 біля кожного роуту. Ви можете залогінитись, скопіювати `accessToken`, натиснути кнопку **Authorize** вгорі сторінки Swagger, вставити туди токен, і всі наступні запити звідти будуть успішно проходити перевірку!

### Phase 5 ✅: List & Card Modules — Пояснення 📝

У цій фазі ми створили одразу два модулі: `ListModule` та `CardModule`. Вони працюють за точно таким самим принципом, що і `BoardModule`.

#### 1. Роутинг і контролери
В Express ви мали маршрути на зразок `/api/boards/:boardId/lists`. У NestJS ми розділили логіку на два контролери:
* `ListController` висить на роуті `/lists`. Для отримання списків дошки ми використовуємо роут `@Get('board/:boardId')`.
* `CardController` висить на роуті `/cards`. Для карток: `@Get('list/:listId')`.
Всі ендпоінти так само захищені одним декоратором `@UseGuards(JwtAuthGuard)` на рівні всього класу!

#### 2. Транзакції Drizzle (`db.transaction()`)
У сервісах (`ListService` та `CardService`) ми маємо багато складної логіки для переміщення списків та карток (`position`). Ця логіка вимагає виконання одразу кількох SQL-запитів поспіль.
В Express ми робили:
```typescript
db.transaction(async (tx) => { ... })
```
В NestJS це виглядає майже ідентично, тільки ми звертаємося до нашого заін'єкченого провайдера:
```typescript
this.db.transaction(async (tx) => { ... })
```
Логіка перерахунку позицій (`position: sql\`${lists.position} + 1\``) була перенесена один-в-один!

#### 3. Що ми пропустили? (Activity Logging)
В Express у `card.controller.ts` ми викликали `activityService.logActivity()`. Поки що я залишив там коментар `// TODO: Додати логування активності (Phase 6)`, оскільки ми ще не створили `ActivityModule`. Ми повернемося до цього в наступній фазі, коли будемо налаштовувати логування та email!
### Phase 3 ✅: Auth Module (Zod + JWT) — Пояснення 🛡️

#### 1. ZodValidationPipe 🧹
Ми створили `src/common/pipes/zod-validation.pipe.ts`.
Це клас, який реалізує `PipeTransform`. NestJS пропускає через нього `req.body` **до того**, як воно потрапить у контролер.
Якщо Zod викидає помилку, Pipe ловить її і перетворює на гарний HTTP 400 Bad Request:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

#### 2. Data Transfer Objects (DTO) 📦
В `src/auth/dto/auth.dto.ts` ми залишили ваші Zod-схеми, але додали класи для TypeScript та Swagger:
```typescript
export class RegisterDto implements z.infer<typeof registerSchema> {
  @ApiProperty({ example: 'test@mail.com' })
  email!: string;
  // ...
}
```
Тепер і Swagger знає, які поля чекати, і TypeScript підказує нам їх у контролері.

#### 3. JwtStrategy та JwtAuthGuard 🔐
Ми додали `@nestjs/passport` та `passport-jwt`.
У файлі `src/auth/strategies/jwt.strategy.ts` ми описали логіку діставання токена:
```typescript
jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
```
Тепер, щоб закрити будь-який роут від неавторизованих користувачів, нам достатньо написати:
```typescript
@UseGuards(JwtAuthGuard)
@Get('secret-data')
```

#### 4. Декоратор @CurrentUser() 👤
Замість `req.user` ми створили власний декоратор `src/auth/decorators/current-user.decorator.ts`.
Тепер код виглядає чисто:
```typescript
getProfile(@CurrentUser() user: JwtPayload) {
  return user.email;
}
```

#### 5. AuthController та Swagger 🚦
Ми зібрали все в `src/auth/auth.controller.ts`.
* `@UsePipes(new ZodValidationPipe(registerSchema))` — валідує вхідні дані.
* `res.cookie('refreshToken', ...)` — автоматично ставить куку (через `cookie-parser`, який ми додали в `main.ts`).
* `@ApiTags('auth')` та `@ApiOperation()` — автоматично генерують документацію для нашого API!
