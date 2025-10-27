// server.ts
import express from "express";
import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import mysql from "mysql2/promise";
import { betterAuth } from "better-auth";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";

const app = express();
app.use(express.json());

const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASS || "";
const DB_NAME = process.env.DB_NAME || "meetings";
const DB_PORT = Number(process.env.DB_PORT || 3306);

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
    logging: false
});

const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
});

const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
    },
    database: { type: "sequelize", client: sequelize as any }
});

app.use(toNodeHandler(auth));

enum RoomType {
    Small = "Small",
    Medium = "Medium",
    Large = "Large"
}

interface ModelBase {
    id: number;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}

interface RoomAttributes extends ModelBase {
    name: string;
    type: RoomType;
    capacity: number;
}
interface RoomCreationAttributes extends Optional<RoomAttributes, "id" | "createdAt" | "updatedAt"> {}
class Room extends Model<RoomAttributes, RoomCreationAttributes> implements RoomAttributes {
    public id!: number;
    public ownerId!: string;
    public name!: string;
    public type!: RoomType;
    public capacity!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Room.init(
    {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        ownerId: { type: DataTypes.STRING(191), allowNull: false },
        name: { type: DataTypes.STRING(191), allowNull: false },
        type: { type: DataTypes.ENUM(...Object.values(RoomType)), allowNull: false },
        capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    },
    { sequelize, tableName: "rooms", timestamps: true, indexes: [{ fields: ["ownerId"] }, { fields: ["type"] }] }
);

interface BookingAttributes extends ModelBase {
    roomId: number;
    title: string;
    start: Date;
    end: Date;
    attendees: number;
}
interface BookingCreationAttributes extends Optional<BookingAttributes, "id" | "createdAt" | "updatedAt"> {}
class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
    public id!: number;
    public ownerId!: string;
    public roomId!: number;
    public title!: string;
    public start!: Date;
    public end!: Date;
    public attendees!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Booking.init(
    {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        ownerId: { type: DataTypes.STRING(191), allowNull: false },
        roomId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        title: { type: DataTypes.STRING(191), allowNull: false },
        start: { type: DataTypes.DATE, allowNull: false },
        end: { type: DataTypes.DATE, allowNull: false },
        attendees: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    },
    { sequelize, tableName: "bookings", timestamps: true, indexes: [{ fields: ["ownerId"] }, { fields: ["roomId"] }, { fields: ["start"] }, { fields: ["end"] }] }
);

async function syncDb() {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
}
syncDb().catch((e) => {
    console.error(e);
    process.exit(1);
});

type AuthedRequest = express.Request & { auth?: { user: { id: string } } };

function requireAuth(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
    try {
        const session = (req as any).auth;
        if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });
        next();
    } catch {
        return res.status(401).json({ error: "Unauthorized" });
    }
}

function userId(req: AuthedRequest): string {
    return (req as any).auth.user.id as string;
}

function isNonEmptyString(x: unknown): x is string {
    return typeof x === "string" && x.trim().length > 0;
}
function isPositiveInt(x: unknown): x is number {
    return Number.isInteger(x) && (x as number) > 0;
}
function parseIntParam(x: unknown): number {
    const n = Number(x);
    if (!Number.isInteger(n) || n <= 0) throw new Error("Invalid id");
    return n;
}
function isRoomType(x: unknown): x is RoomType {
    return typeof x === "string" && (Object.values(RoomType) as string[]).includes(x);
}
function isISODateString(x: unknown): x is string {
    return typeof x === "string" && !Number.isNaN(Date.parse(x));
}
function validateRoomOutput(r: any): r is RoomAttributes {
    return (
        r &&
        isPositiveInt(r.id) &&
        isNonEmptyString(r.ownerId) &&
        isNonEmptyString(r.name) &&
        isRoomType(r.type) &&
        isPositiveInt(r.capacity) &&
        new Date(r.createdAt).toString() !== "Invalid Date" &&
        new Date(r.updatedAt).toString() !== "Invalid Date"
    );
}
function validateBookingOutput(b: any): b is BookingAttributes {
    return (
        b &&
        isPositiveInt(b.id) &&
        isNonEmptyString(b.ownerId) &&
        isPositiveInt(b.roomId) &&
        isNonEmptyString(b.title) &&
        new Date(b.start).toString() !== "Invalid Date" &&
        new Date(b.end).toString() !== "Invalid Date" &&
        isPositiveInt(b.attendees) &&
        new Date(b.createdAt).toString() !== "Invalid Date" &&
        new Date(b.updatedAt).toString() !== "Invalid Date"
    );
}

function nowUtc(): Date {
    return new Date();
}
function addDays(d: Date, n: number): Date {
    const x = new Date(d.getTime());
    x.setUTCDate(x.getUTCDate() + n);
    return x;
}
function diffMs(a: Date, b: Date) {
    return a.getTime() - b.getTime();
}
async function assertRoomExists(roomId: number): Promise<RoomAttributes> {
    const r = await Room.findByPk(roomId);
    if (!r) throw new Error("Room not found");
    return r.toJSON() as RoomAttributes;
}
async function assertNoOverlap(roomId: number, start: Date, end: Date, ignoreBookingId?: number) {
    const [rows] = await pool.query<any>(
        `SELECT id FROM bookings
         WHERE roomId = :roomId
         AND start < :end
         AND end > :start
         ${ignoreBookingId ? "AND id <> :ignoreId" : ""}
         LIMIT 1`,
        { roomId, start, end, ignoreId: ignoreBookingId }
    );
    if (Array.isArray(rows) && rows.length > 0) throw new Error("Overlapping booking exists");
}
function ensureBookingBusinessRules(room: RoomAttributes, startIso: string, endIso: string, attendees: number) {
    if (!isISODateString(startIso) || !isISODateString(endIso)) throw new Error("Invalid dates");
    const start = new Date(startIso);
    const end = new Date(endIso);
    const n = nowUtc();
    if (diffMs(start, n) <= 0) throw new Error("Start must be in the future");
    if (start > addDays(n, 30)) throw new Error("Start must be within 30 days");
    if (diffMs(end, start) < 60 * 60 * 1000) throw new Error("Duration must be at least 1 hour");
    if (!Number.isInteger(attendees) || attendees <= 0) throw new Error("Invalid attendees");
    if (attendees > room.capacity) throw new Error("Attendees exceed room capacity");
    return { start, end };
}

app.use(requireAuth);

app.post("/rooms", async (req: AuthedRequest, res) => {
    try {
        const ownerId = userId(req);
        const { name, type, capacity } = req.body ?? {};
        if (!isNonEmptyString(name)) throw new Error("Invalid name");
        if (!isRoomType(type)) throw new Error("Invalid type");
        if (!isPositiveInt(capacity)) throw new Error("Invalid capacity");
        const created = await Room.create({ ownerId, name: name.trim(), type, capacity });
        const out = created.toJSON();
        if (!validateRoomOutput(out)) throw new Error("Invalid output");
        return res.status(200).json(out);
    } catch (e: any) {
        return res.status(e.message === "Unauthorized" ? 401 : 500).json({ error: e.message || "Server error" });
    }
});

app.get("/rooms", async (req: AuthedRequest, res) => {
    try {
        const ownerId = userId(req);
        const rows = await Room.findAll({ where: { ownerId }, order: [["id", "ASC"]] });
        const out = rows.map((r) => r.toJSON());
        if (!out.every(validateRoomOutput)) throw new Error("Invalid output");
        return res.status(200).json(out);
    } catch (e: any) {
        return res.status(e.message === "Unauthorized" ? 401 : 500).json({ error: e.message || "Server error" });
    }
});

app.get("/rooms/:id", async (req: AuthedRequest, res) => {
    try {
        const ownerId = userId(req);
        const id = parseIntParam(req.params.id);
        const row = await Room.findOne({ where: { id, ownerId } });
        if (!row) throw new Error("Not found");
        const out = row.toJSON();
        if (!validateRoomOutput(out)) throw new Error("Invalid output");
        return res.status(200).json(out);
    } catch (e: any) {
        return res.status(e.message === "Unauthorized" ? 401 : 500).json({ error: e.message || "Server error" });
    }
});

app.put("/rooms/:id", async (req: AuthedRequest, res) => {
    try {
        const ownerId = userId(req);
        const id = parseIntParam(req.params.id);
        const { name, type, capacity } = req.body ?? {};
        if (name !== undefined && !isNonEmptyString(name)) throw new Error("Invalid name");
        if (type !== undefined && !isRoomType(type)) throw new Error("Invalid type");
        if (capacity !== undefined && !isPositiveInt(capacity)) throw new Error("Invalid capacity");
        const row = await Room.findOne({ where: { id, ownerId } });
        if (!row) throw new Error("Not found");
        if (name !== undefined) row.name = name.trim();
        if (type !== undefined) row.type = type;
        if (capacity !== undefined) row.capacity = capacity;
        await row.save();
        const out = row.toJSON();
        if (!validateRoomOutput(out)) throw new Error("Invalid output");
        return res.status(200).json(out);
    } catch (e: any) {
        return res.status(e.message === "Unauthorized" ? 401 : 500).json({ error: e.message || "Server error" });
    }
});

app.delete("/rooms/:id", async (req: AuthedRequest, res) => {
    try {
        const ownerId = userId(req);
        const id = parseIntParam(req.params.id);
        const row = await Room.findOne({ where: { id, ownerId } });
        if (!row) throw new Error("Not found");
        await row.destroy();
        return res.status(200).json({ ok: true });
    } catch (e: any) {
        return res.status(e.message === "Unauthorized" ? 401 : 500).json({ error: e.message || "Server error" });
    }
});

app.post("/bookings", async (req: AuthedRequest, res) => {
    try {
        const ownerId = userId(req);
        const { roomId, title, start, end, attendees } = req.body ?? {};
        if (!isPositiveInt(roomId)) throw new Error("Invalid roomId");
        if (!isNonEmptyString(title)) throw new Error("Invalid title");
        const room = await assertRoomExists(roomId);
        const { start: s, end: e } = ensureBookingBusinessRules(room, start, end, attendees);
        await assertNoOverlap(roomId, s, e);
        const created = await Booking.create({
            ownerId,
            roomId,
            title: title.trim(),
            start: s,
            end: e,
            attendees
        });
        const out = created.toJSON();
        if (!validateBookingOutput(out)) throw new Error("Invalid output");
        return res.status(200).json(out);
    } catch (e: any) {
        return res.status(e.message === "Unauthorized" ? 401 : 500).json({ error: e.message || "Server error" });
    }
});

app.get("/bookings", async (req: AuthedRequest, res) => {
    try {
        const ownerId = userId(req);
        const rows = await Booking.findAll({ where: { ownerId }, order: [["start", "ASC"]] });
        const out = rows.map((r) => r.toJSON());
        if (!out.every(validateBookingOutput)) throw new Error("Invalid output");
        return res.status(200).json(out);
    } catch (e: any) {
        return res.status(e.message === "Unauthorized" ? 401 : 500).json({ error: e.message || "Server error" });
    }
});

app.get("/bookings/:id", async (req: AuthedRequest, res) => {
    try {
        const ownerId = userId(req);
        const id = parseIntParam(req.params.id);
        const row = await Booking.findOne({ where: { id, ownerId } });
        if (!row) throw new Error("Not found");
        const out = row.toJSON();
        if (!validateBookingOutput(out)) throw new Error("Invalid output");
        return res.status(200).json(out);
    } catch (e: any) {
        return res.status(e.message === "Unauthorized" ? 401 : 500).json({ error: e.message || "Server error" });
    }
});

app.put("/bookings/:id", async (req: AuthedRequest, res) => {
    try {
        const ownerId = userId(req);
        const id = parseIntParam(req.params.id);
        const { roomId, title, start, end, attendees } = req.body ?? {};
        const row = await Booking.findOne({ where: { id, ownerId } });
        if (!row) throw new Error("Not found");
        const newRoomId = roomId !== undefined ? (isPositiveInt(roomId) ? roomId : (() => { throw new Error("Invalid roomId"); })()) : row.roomId;
        const newTitle = title !== undefined ? (isNonEmptyString(title) ? title.trim() : (() => { throw new Error("Invalid title"); })()) : row.title;
        const newAttendees = attendees !== undefined ? (isPositiveInt(attendees) ? attendees : (() => { throw new Error("Invalid attendees"); })()) : row.attendees;
        const room = await assertRoomExists(newRoomId);
        const sIso = start !== undefined ? (isISODateString(start) ? start : (() => { throw new Error("Invalid dates"); })()) : row.start.toISOString();
        const eIso = end !== undefined ? (isISODateString(end) ? end : (() => { throw new Error("Invalid dates"); })()) : row.end.toISOString();
        const { start: s, end: e } = ensureBookingBusinessRules(room, sIso, eIso, newAttendees);
        await assertNoOverlap(newRoomId, s, e, id);
        row.roomId = newRoomId;
        row.title = newTitle;
        row.attendees = newAttendees;
        row.start = s;
        row.end = e;
        await row.save();
        const out = row.toJSON();
        if (!validateBookingOutput(out)) throw new Error("Invalid output");
        return res.status(200).json(out);
    } catch (e: any) {
        return res.status(e.message === "Unauthorized" ? 401 : 500).json({ error: e.message || "Server error" });
    }
});

app.delete("/bookings/:id", async (req: AuthedRequest, res) => {
    try {
        const ownerId = userId(req);
        const id = parseIntParam(req.params.id);
        const row = await Booking.findOne({ where: { id, ownerId } });
        if (!row) throw new Error("Not found");
        await row.destroy();
        return res.status(200).json({ ok: true });
    } catch (e: any) {
        return res.status(e.message === "Unauthorized" ? 401 : 500).json({ error: e.message || "Server error" });
    }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
    console.log(`Server on :${PORT}`);
});
