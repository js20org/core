if (window.location.pathname === '/docs' || window.location.pathname === '/docs/') {
    document.getElementById('mainTitle').style.display = 'block';
}

hljs.getLanguage('typescript').keywords.variable += ' ' + [
    'taxDebt',
    'input',
    'oldOwner',
    'updated',
].join(' ');

hljs.getLanguage('typescript').keywords.built_in += ' ' + [
    'verifyNoUnpaidTaxes',
    'verifyTransferApproved',
    'getTransferCertificate',
    'getTaxes',
    'getOwner',
    'updateOwner',
].join(' ');

hljs.highlightAll();

const navigation = [
    {
        icon: "bi bi-rocket-takeoff",
        title: "Getting started",
        links: [
            { href: "/docs", text: "Quick start" },
            { href: "/docs-example-app", text: "Example app" },
            { href: "/docs-project-structure", text: "Project structure" }
        ]
    },
    {
        icon: "bi bi-lightning",
        title: "Core concepts",
        links: [
            { href: "/docs-web-server", text: "Config & Web server" },
            { href: "/docs-schemas", text: "Schemas" },
            { href: "/docs-endpoints", text: "Endpoints" },
        ]
    },
    {
        icon: "bi bi-database",
        title: "Database & Models",
        links: [
            { href: "/docs-database", text: "Setup database" },
            { href: "/docs-models", text: "Register models" },
            { href: "/docs-transactions", text: "Transactions" },
            { href: "/docs-migration", text: "Migration" },
        ]
    },
    {
        icon: "bi bi-shield-check",
        title: "Auth & ACL",
        links: [
            { href: "/docs-authentication", text: "Authentication" },
            { href: "/docs-logged-in", text: "Logged-in endpoints" },
            { href: "/docs-acl", text: "Use models & ACL" }
        ]
    },
    {
        icon: "bi bi-gear",
        title: "Advanced",
        links: [
            { href: "/docs-generate", text: "Generate frontend" },
            { href: "/docs-params", text: "Route parameters" },
            { href: "/docs-helper-schemas", text: "Helper schemas" },
            { href: "/docs-partial-schemas", text: "Patch & partial schemas" },
            { href: "/docs-actions", text: "Chained actions" },
            { href: "/docs-crud", text: "Automatic CRUD" },
            { href: "/docs-errors", text: "Error handling" },
            { href: "/docs-cors", text: "CORS" },
            { href: "/docs-bypass", text: "Bypass ACL" }
        ]
    },
    {
        icon: "bi bi-code-slash",
        title: "API reference",
        links: [
            { href: "/docs-api-reference", text: "Documentation" }
        ]
    }
]

function renderNavigation() {
    const container = document.querySelector('#navigation')
    if (!container) return;

    container.innerHTML = navigation.map(section => `
        <div class="section">
            <p class="header">
                <i class="${section.icon}"></i>
                <span>${section.title}</span>
            </p>
            <div class="body">
                ${section.links.map(link => `<a href="${link.href}">${link.text}</a>`).join('')}
            </div>
        </div>
    `).join('')
}

renderNavigation();

function renderNextRead(currentPath) {
    const allLinks = navigation.flatMap(section => section.links)
    const currentIndex = allLinks.findIndex(link => link.href === currentPath)
    if (currentIndex === -1) return

    const next = allLinks[currentIndex + 1]
    const container = document.querySelector('#nextRead')

    if (!next) return

    container.innerHTML = `<a class="next" href="${next.href}">
<div class="body">
    <p class="header gradient">Next read →</p>
    <div class="link">
        <i class="bi bi-book"></i>
        <p class="next">${next.text}</p>
    </div>
</div>
</a>`;
}

renderNextRead(window.location.pathname);

function highlightCurrentNav() {
    const currentPath = window.location.pathname
    document.querySelectorAll('#navigation a').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('current')
        }
    })
}

highlightCurrentNav();

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const docsLeft = document.getElementById('docsLeft');

    if (!docsLeft) return;

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            docsLeft.classList.add('visible');
        });
    }

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', () => {
            docsLeft.classList.remove('visible');
        });
    }

    // Close menu when clicking on navigation links
    document.querySelectorAll('#navigation a').forEach(link => {
        link.addEventListener('click', () => {
            docsLeft.classList.remove('visible');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (docsLeft.classList.contains('visible') && 
            !docsLeft.contains(e.target) && 
            !mobileMenuToggle.contains(e.target)) {
            docsLeft.classList.remove('visible');
        }
    });
}

initMobileMenu();

const codeExamples = [
    {
        title: 'API handler logic',
        beforeLabel: 'Manually handle Auth, ACL, validation & database operations',
        afterLabel: 'One line of code, JS20 handles everything under the hood',
        before: `async function updateCar(req) {
    verifyLoggedIn(req);

    const id = req.params.id;
    if (!id) throw new Error('ID is required');

    const input = validateAndSanitize(req.body, carSchema);
    const existing = await prisma.car.findUnique({ where: {
        id,
        ownerId: req.user.id
    }});

    if (!existing) throw new Error('Car not found');
    verifyACL(req.user, 'update', existing);

    const newCar = await prisma.car.update({ where: {
        id,
        ownerId: req.user.id,
    }, data: {
        ...existing,
        ...input,
        updatedAt: new Date(),
    }});

    validate(newCar, Schema.withInstance(carSchema));
    return newCar;
}`,
        after: `async function run(system, input) {
    return system.models.car.create(input);
}`,
    },
    {
        title: 'Full CRUD API',
        beforeLabel: 'Manually implement all CRUD operations: list, get, create, update, delete',
        afterLabel: 'One line of code generates all CRUD operations',
        before: `async function requireId(req: Request) {
    const id = req.params.id;
    if (!id) throw new Error('ID is required');
    return id;
}

async function loadCar(req: Request, action: 'read' | 'update' | 'delete') {
    verifyLoggedIn(req);
    const id = await requireId(req);
    const existing = await prisma.car.findUnique({
        where: { id, ownerId: req.user.id }
    });
    if (!existing) throw new Error('Car not found');
    verifyACL(req.user, action, existing);
    return existing;
}

async function createCar(req: Request) {
    verifyLoggedIn(req);
    verifyACL(req.user, 'create');
    const input = validateAndSanitize(req.body, carSchema);
    const newCar = await prisma.car.create({
        data: {
            ...input,
            ownerId: req.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    });
    validate(newCar, Schema.withInstance(carSchema));
    return newCar;
}

async function getCar(req: Request) {
    const existing = await loadCar(req, 'read');
    validate(existing, Schema.withInstance(carSchema));
    return existing;
}

async function listCars(req: Request) {
    verifyLoggedIn(req);
    verifyACL(req.user, 'list');
    const take = Math.min(parseInt(String(req.query.take ?? '50'), 10) || 50, 100);
    const cursor = req.query.cursor ? { id: String(req.query.cursor) } : undefined;
    const cars = await prisma.car.findMany({
        where: { ownerId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take,
        ...(cursor ? { skip: 1, cursor } : {})
    });
    cars.forEach(c => validate(c, Schema.withInstance(carSchema)));
    return cars;
}

async function updateCar(req: Request) {
    verifyLoggedIn(req);
    const id = await requireId(req);
    const input = validateAndSanitize(req.body, carSchema);
    const existing = await prisma.car.findUnique({
        where: { id, ownerId: req.user.id }
    });
    if (!existing) throw new Error('Car not found');
    verifyACL(req.user, 'update', existing);
    const newCar = await prisma.car.update({
        where: { id, ownerId: req.user.id },
        data: {
            ...existing,
            ...input,
            updatedAt: new Date()
        }
    });
    validate(newCar, Schema.withInstance(carSchema));
    return newCar;
}

async function deleteCar(req: Request) {
    const existing = await loadCar(req, 'delete');
    const deleted = await prisma.car.delete({
        where: { id: existing.id, ownerId: req.user.id }
    });
    return { id: deleted.id, status: 'deleted' };
}`,
        after: `app.addCrudEndpoints(car);`,
    },
    {
        title: 'Auth setup',
        beforeLabel: 'Manually set up auth library & pass middleware',
        afterLabel: 'One line setup, endpoints are logged in by default if auth exists',
        before: `const auth = betterAuth({
    database: myDatabase,
    emailAndPassword: {
        enabled: true,
    }
});

async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
        return res.status(401).json({ error: "unauthorized" });
    }

    // attach session to request
    (req as any).session = session;
    next();
}

app.all("/api/auth/*", toNodeHandler(auth));

app.get("/api/me", requireAuth, (req, res) => {
    res.json({ user: (req as any).session.user });
});`,
        after: `app.setAuthenticator(new BetterAuth(database, {
    useEmailPassword: true,
}));

app.addEndpoint({
    method: 'GET',
    path: '/api/me',
    run: async (system) {
        return { user: system.user };
    }
});`
    },
    {
        title: 'Model schema & table init',
        beforeLabel: 'Manually initialize DB tables with e.g. Prisma',
        afterLabel: 'Automatically generate SQL tables from schema',
        before: `/* prisma/schema.prisma
generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "sqlite"
    url      = "file:./dev.db"
}

model Car {
    id                  Int      @id @default(autoincrement())
    createdAt           DateTime @default(now())
    updatedAt           DateTime @updatedAt
    isLeased            Boolean  @default(false)
    registrationNumber  String   @unique
}
*/

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const CarInputSchema = z.object({
    isLeased: z.boolean().default(false),
    registrationNumber: z.string().regex(/^[A-Z0-9]{1,7}$/),
});

async function createCar(raw: any) {
    const parsed = CarInputSchema.parse(raw);
    await prisma.car.create({ data: parsed });
}

/* package.json
"scripts": {
    "postinstall": "prisma generate && prisma db push"
}
*/`,
        after: `const sCar = {
    isLeased: sBoolean().type(),
    registrationNumber: sString().matches(/^[A-Z0-9]{1,7}$/).type(),
}

const models = {
    car: {
        name: 'car',
        schema: sCar,
    }
};

const database = new MySqlDatabase(connectOptions, {
    initializeTables: true,
});

database.addModels(models);`
    },
    {
        title: 'Frontend SDK',
        beforeLabel: 'Manually maintain a second set of types, validation, and API calls for frontend',
        afterLabel: 'Hit generate, get typesafe frontend SDK for free',
        before: `import { z } from "zod"

const BASE_URL = "https://www.example.com"

export type ModelInstance<T> = T & {
    id: string
    ownerId: string
    createdAt?: string
    updatedAt?: string
}

export const CarSchema = z.object({
    registrationNumber: z.string().min(1),
    isLeased: z.boolean()
})

export type Car = z.infer<typeof CarSchema>

const IdSchema = z.union([z.string().min(1), z.number()]).transform(String)

const CarInstanceSchema = CarSchema.extend({
    id: z.union([z.string(), z.number()]).transform(String),
    ownerId: z.string(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
})

const ListCarSchema = z.array(CarInstanceSchema)

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

function getToken(): string {
    const token = localStorage.getItem("token")
    if (!token) {
        throw new Error("Missing auth token")
    }
    return token
}

async function http<T>(
    path: string,
    method: HttpMethod,
    input?: unknown,
    outputSchema?: z.ZodType<T>
): Promise<T> {
    try {
        const res = await fetch(BASE_URL + path, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + getToken()
            },
            body: input === undefined ? undefined : JSON.stringify(input)
        })

        const data = await res.json()

        if (!res.ok) {
            throw new Error(data?.message || "Request failed")
        }

        if (outputSchema) {
            return outputSchema.parse(data)
        }

        return data
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            throw new Error("Validation failed")
        }

        throw new Error(e?.message || "Unknown error")
    }
}

export async function listCars(): Promise<ModelInstance<Car>[]> {
    return http("/car", "GET", undefined, ListCarSchema)
}

export async function getCar(id: string | number): Promise<ModelInstance<Car>> {
    const safeId = IdSchema.parse(id)
    return http("/car/" + encodeURIComponent(safeId), "GET", undefined, CarInstanceSchema)
}

export async function createCar(data: Car): Promise<ModelInstance<Car>> {
    const payload = CarSchema.parse(data)
    return http("/car", "POST", payload, CarInstanceSchema)
}

export async function updateCar(id: string | number, data: Car): Promise<ModelInstance<Car>> {
    const safeId = IdSchema.parse(id)
    const payload = CarSchema.parse(data)
    return http("/car/" + encodeURIComponent(safeId), "PUT", payload, CarInstanceSchema)
}

export async function deleteCar(id: string | number): Promise<void> {
    const safeId = IdSchema.parse(id)
    await http("/car/" + encodeURIComponent(safeId), "DELETE")
}`,
        after: `await app.generate({
    entryPath: path.resolve('./src/types.ts'),
    outputs: ['./dist/client.ts'],
    baseUrl: 'https://www.example.com',
});`
    }
];

let currentCodeExampleIndex = 0;

function renderCodeExample(index) {
    const example = codeExamples[index];
    if (!example) return;

    const beforeCount = getCodeSize(example.before);
    const afterCount = getCodeSize(example.after);
    const reduction = Math.round((1 - (afterCount / beforeCount)) * 100);

    if (!document.getElementById('comparisonTitle')) return;

    document.getElementById('comparisonTitle').innerText = example.title;
    document.getElementById('comparisonBeforeCode').innerHTML = example.before;
    document.getElementById('comparisonAfterCode').innerHTML = example.after;
    document.getElementById('comparisonCount').innerText = index + 1;
    document.getElementById('comparisonTotal').innerText = codeExamples.length;
    document.getElementById('comparisonBeforeLabel').innerText = example.beforeLabel;
    document.getElementById('comparisonAfterLabel').innerText = example.afterLabel;
    document.getElementById('comparisonReduction').innerText = reduction + '%';
    
    disableNextPrevButtons(index);

    delete document.getElementById('comparisonBeforeCode').dataset.highlighted;
    delete document.getElementById('comparisonAfterCode').dataset.highlighted;
    hljs.highlightAll();
}

function getCodeSize(text) {
    return text.replace(/\s+/g, '').length;
}

document.getElementById('comparisonPrevious')?.addEventListener('click', () => {
    currentCodeExampleIndex = Math.max(0, currentCodeExampleIndex - 1);
    renderCodeExample(currentCodeExampleIndex);
});

document.getElementById('comparisonNext')?.addEventListener('click', () => {
    currentCodeExampleIndex = Math.min(codeExamples.length - 1, currentCodeExampleIndex + 1);
    renderCodeExample(currentCodeExampleIndex);
});

function disableNextPrevButtons(index) {
    document.getElementById('comparisonPrevious').disabled = index === 0;
    document.getElementById('comparisonNext').disabled = index === codeExamples.length - 1;
}

renderCodeExample(currentCodeExampleIndex);

async function renderReduction() {
    const path = 'public/reduction.json';
    const reductionData = await fetch(path).then(res => res.json());
    if (!reductionData) return;

    const elements = document.querySelectorAll('.codeReduction');
    elements.forEach(el => {
        el.innerHTML = reductionData.reductionString;
    });
}

renderReduction();

// Cookie Banner functionality
function initCookieBanner() {
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptButton = document.getElementById('acceptCookies');
    
    if (!cookieBanner || !acceptButton) return;
    
    // Check if cookies have been accepted
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    
    if (!cookiesAccepted) {
        cookieBanner.style.display = 'block';
    }
    
    // Handle accept button click
    acceptButton.addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'true');
        cookieBanner.style.display = 'none';
    });
}

initCookieBanner();