// client.ts
export enum RoomType {
    Small = "Small",
    Medium = "Medium",
    Large = "Large"
}

export interface ModelInstance {
    id: number;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Room extends ModelInstance {
    name: string;
    type: RoomType;
    capacity: number;
}

export interface Booking extends ModelInstance {
    roomId: number;
    title: string;
    start: string;
    end: string;
    attendees: number;
}

type Json = Record<string, any>;

function isNonEmptyString(x: unknown): x is string {
    return typeof x === "string" && x.trim().length > 0;
}
function isPositiveInt(x: unknown): x is number {
    return Number.isInteger(x) && (x as number) > 0;
}
function isRoomType(x: unknown): x is RoomType {
    return typeof x === "string" && (Object.values(RoomType) as string[]).includes(x);
}
function isISODateString(x: unknown): x is string {
    return typeof x === "string" && !Number.isNaN(Date.parse(x));
}
function hasTimestamps(o: any): o is { createdAt: string; updatedAt: string } {
    return isISODateString(o?.createdAt) && isISODateString(o?.updatedAt);
}

function assertRoomOutput(o: any): asserts o is Room {
    if (
        !o ||
        !isPositiveInt(o.id) ||
        !isNonEmptyString(o.ownerId) ||
        !isNonEmptyString(o.name) ||
        !isRoomType(o.type) ||
        !isPositiveInt(o.capacity) ||
        !hasTimestamps(o)
    ) {
        throw new Error("Invalid Room output");
    }
}
function assertBookingOutput(o: any): asserts o is Booking {
    if (
        !o ||
        !isPositiveInt(o.id) ||
        !isNonEmptyString(o.ownerId) ||
        !isPositiveInt(o.roomId) ||
        !isNonEmptyString(o.title) ||
        !isISODateString(o.start) ||
        !isISODateString(o.end) ||
        !isPositiveInt(o.attendees) ||
        !hasTimestamps(o)
    ) {
        throw new Error("Invalid Booking output");
    }
}

function authHeader(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!token) throw new Error("Missing auth token");
    return { Authorization: token, "Content-Type": "application/json" };
}

async function handle<T>(res: Response, validator: (x: any) => void): Promise<T> {
    let data: any = null;
    try {
        data = await res.json();
    } catch {
        throw new Error("Invalid JSON response");
    }
    if (!res.ok) {
        const msg = isNonEmptyString(data?.error) ? data.error : `HTTP ${res.status}`;
        if (res.status === 401) throw new Error(`Unauthorized: ${msg}`);
        throw new Error(msg);
    }
    validator(data);
    return data as T;
}

const base = (path: string) => path;

export async function createRoom(data: { name: string; type: RoomType; capacity: number }): Promise<Room & ModelInstance> {
    if (!isNonEmptyString(data?.name)) throw new Error("Invalid name");
    if (!isRoomType(data?.type)) throw new Error("Invalid type");
    if (!isPositiveInt(data?.capacity)) throw new Error("Invalid capacity");
    const res = await fetch(base("/rooms"), {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ name: data.name.trim(), type: data.type, capacity: data.capacity })
    });
    return handle<Room>(res, assertRoomOutput);
}

export async function listRooms(): Promise<(Room & ModelInstance)[]> {
    const res = await fetch(base("/rooms"), { headers: authHeader() });
    return handle<Room[]>(res, (arr: any) => {
        if (!Array.isArray(arr)) throw new Error("Invalid output");
        arr.forEach(assertRoomOutput);
    });
}

export async function getRoom(id: number): Promise<Room & ModelInstance> {
    if (!isPositiveInt(id)) throw new Error("Invalid id");
    const res = await fetch(base(`/rooms/${id}`), { headers: authHeader() });
    return handle<Room>(res, assertRoomOutput);
}

export async function updateRoom(id: number, data: Partial<{ name: string; type: RoomType; capacity: number }>): Promise<Room & ModelInstance> {
    if (!isPositiveInt(id)) throw new Error("Invalid id");
    if (data.name !== undefined && !isNonEmptyString(data.name)) throw new Error("Invalid name");
    if (data.type !== undefined && !isRoomType(data.type)) throw new Error("Invalid type");
    if (data.capacity !== undefined && !isPositiveInt(data.capacity)) throw new Error("Invalid capacity");
    const res = await fetch(base(`/rooms/${id}`), {
        method: "PUT",
        headers: authHeader(),
        body: JSON.stringify(data)
    });
    return handle<Room>(res, assertRoomOutput);
}

export async function deleteRoom(id: number): Promise<{ ok: true }> {
    if (!isPositiveInt(id)) throw new Error("Invalid id");
    const res = await fetch(base(`/rooms/${id}`), { method: "DELETE", headers: authHeader() });
    return handle<{ ok: true }>(res, (o: any) => {
        if (o?.ok !== true) throw new Error("Invalid output");
    });
}

export async function createBooking(data: {
    roomId: number;
    title: string;
    start: string;
    end: string;
    attendees: number;
}): Promise<Booking & ModelInstance> {
    if (!isPositiveInt(data?.roomId)) throw new Error("Invalid roomId");
    if (!isNonEmptyString(data?.title)) throw new Error("Invalid title");
    if (!isISODateString(data?.start) || !isISODateString(data?.end)) throw new Error("Invalid dates");
    if (!isPositiveInt(data?.attendees)) throw new Error("Invalid attendees");
    const res = await fetch(base("/bookings"), {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
            roomId: data.roomId,
            title: data.title.trim(),
            start: data.start,
            end: data.end,
            attendees: data.attendees
        })
    });
    return handle<Booking>(res, assertBookingOutput);
}

export async function listBookings(): Promise<(Booking & ModelInstance)[]> {
    const res = await fetch(base("/bookings"), { headers: authHeader() });
    return handle<Booking[]>(res, (arr: any) => {
        if (!Array.isArray(arr)) throw new Error("Invalid output");
        arr.forEach(assertBookingOutput);
    });
}

export async function getBooking(id: number): Promise<Booking & ModelInstance> {
    if (!isPositiveInt(id)) throw new Error("Invalid id");
    const res = await fetch(base(`/bookings/${id}`), { headers: authHeader() });
    return handle<Booking>(res, assertBookingOutput);
}

export async function updateBooking(
    id: number,
    data: Partial<{ roomId: number; title: string; start: string; end: string; attendees: number }>
): Promise<Booking & ModelInstance> {
    if (!isPositiveInt(id)) throw new Error("Invalid id");
    if (data.roomId !== undefined && !isPositiveInt(data.roomId)) throw new Error("Invalid roomId");
    if (data.title !== undefined && !isNonEmptyString(data.title)) throw new Error("Invalid title");
    if (data.start !== undefined && !isISODateString(data.start)) throw new Error("Invalid start");
    if (data.end !== undefined && !isISODateString(data.end)) throw new Error("Invalid end");
    if (data.attendees !== undefined && !isPositiveInt(data.attendees)) throw new Error("Invalid attendees");
    const res = await fetch(base(`/bookings/${id}`), {
        method: "PUT",
        headers: authHeader(),
        body: JSON.stringify(data)
    });
    return handle<Booking>(res, assertBookingOutput);
}

export async function deleteBooking(id: number): Promise<{ ok: true }> {
    if (!isPositiveInt(id)) throw new Error("Invalid id");
    const res = await fetch(base(`/bookings/${id}`), { method: "DELETE", headers: authHeader() });
    return handle<{ ok: true }>(res, (o: any) => {
        if (o?.ok !== true) throw new Error("Invalid output");
    });
}
