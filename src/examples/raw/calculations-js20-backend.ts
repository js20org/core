import { sDate, sEnum, sInteger, sString } from '@js20/schema';
import { type Model, App, sMessage, MySqlDatabase, BetterAuth } from '@js20/core';
import { Op } from 'sequelize';

enum RoomType {
    Small = "Small",
    Medium = "Medium",
    Large = "Large"
}

interface Room {
    name: string;
    type: RoomType;
    capacity: number;
}

interface Booking {
    roomId: number;
    title: string;
    start: Date;
    end: Date;
    attendees: number;
}

const sRoom: Room = {
    name: sString().type(),
    type: sEnum<RoomType>(RoomType).type(),
    capacity: sInteger().type(),
}

const sBooking: Booking = {
    roomId: sInteger().type(),
    title: sString().type(),
    start: sDate().type(),
    end: sDate().type(),
    attendees: sInteger().type(),
}

interface Models {
    room: Model<Room>;
    booking: Model<Booking>;
}

const models: Models = {
    room: {
        name: 'Room',
        schema: sRoom,
    },
    booking: {
        name: 'Booking',
        schema: sBooking,
    },
};

const app = new App<Models>();

const verifyBooking = app.action({
    inputSchema: sBooking,
    outputSchema: sMessage,
    run: async (system, input) => {
        const bookings = await system.bypassAcl.models.booking.getAll({
            roomId: input.roomId,
            start: { [Op.lt]: input.end },
            end: { [Op.gt]: input.start },
        });

        const room = await system.bypassAcl.models.room.getById(input.roomId + '');

        const conflict = bookings.length > 0;
        const validDuration = (input.end.getTime() - input.start.getTime()) / (1000 * 60 * 60) >= 1;
        const validStart = input.start > new Date() && input.start < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const capacity = room && input.attendees <= room.capacity;
        const valid = !conflict && validDuration && validStart && capacity;

        if (!valid) {
            throw new Error('Invalid booking');
        }

        return { message: 'Ok' };
    }
});

const database = new MySqlDatabase({
    host: process.env.SQL_HOST || '',
    port: parseInt(process.env.SQL_PORT || '5432'),
    user: process.env.SQL_USER || '',
    password: process.env.SQL_PASSWORD || '',
    database: process.env.SQL_DATABASE || '',
});

database.addModels(models);
app.addDatabase(database);
app.setAuthenticator(new BetterAuth(database));
app.addCrudEndpoints(models.room);
app.addCrudEndpoints(models.booking, { actions: {
    createBefore: verifyBooking,
    updateBefore: verifyBooking,
}});

app.start();