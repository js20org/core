// <app>
import path from 'path';
import * as dotenv from 'dotenv';

import { App, type Model, type MysqlConnectOptions, MySqlDatabase, BetterAuth, Schema, sMessage } from '@js20/core'
import { sString, sBoolean, sInteger, sEnum, sNumber } from '@js20/schema'

dotenv.config({ quiet: true });


// ------------ Types ------------------

enum BookCategory {
    Fiction = 'Fiction',
    NonFiction = 'NonFiction',
    Science = 'Science',
    History = 'History',
    Fantasy = 'Fantasy',
}

interface Book {
    title: string;
    author: string;
    isFinished: boolean;
    averageRating?: number;
    category: BookCategory;
}

interface Review {
    bookId: string;
    comment: string;
    stars: number;
}

interface Models {
    book: Model<Book>;
    review: Model<Review>;
}


// ------------ Schemas ------------------

const sBook: Book = {
    title: sString().maxLength(255).type(),
    author: sString().maxLength(255).type(),
    isFinished: sBoolean().type(),
    averageRating: sNumber().min(1).max(5).optional().type(),
    category: sEnum<BookCategory>(BookCategory).type(),
}

const sReview: Review = {
    bookId: sString().matches(/^[0-9a-fA-F-]{36}$/).type(),
    comment: sString().maxLength(500).type(),
    stars: sInteger().min(1).max(5).type(),
}


// ------------ Models ------------------

const models: Models = {
    book: {
        name: 'book',
        schema: sBook,
    },
    review: {
        name: 'review',
        schema: sReview,
    },
}


// ------------ App ------------------

const app = new App<Models>();


// ----------- Actions ------------------

const assertBookLimit = app.action({
    outputSchema: sMessage,
    run: async (system) => {
        const maxBooksPerUser = 20;
        const count = await system.models.book.count();

        if (count >= maxBooksPerUser) {
            throw new Error(`You can only create up to ${maxBooksPerUser} books.`);
        }

        return { message: 'Ok' };
    },
});

const updateAverageRating = app.action({
    inputSchema: Schema.withInstance(sBook),
    outputSchema: sMessage,
    run: async (system, input) => {
        // Get all reviews for the book, bypassing "where ownerId = user.id"
        const reviews = await system.bypassAcl.models.review.getAll({
            bookId: input.id,
        });

        if (!reviews.length) {
            return { 
                message: 'No reviews found for book'
            };
        }

        const sum = reviews.reduce((acc, r: any) => acc + Number(r.stars || 0), 0);
        const avg = sum / reviews.length;

        await system.models.book.updateById(input.id, {
            averageRating: Math.round(avg),
        });

        return { 
            message: `Updated average rating to ${Math.round(avg)}`
        };
    }
});


// ----------- Endpoints ------------------

// Adds get, list, create, update & delete endpoints
app.addCrudEndpoints(models.book, {
    actions: {
        createBefore: assertBookLimit,
    }
});

// Adds get, list, create, update & delete endpoints
app.addCrudEndpoints(models.review, {
    actions: {
        createAfter: updateAverageRating,
        updateAfter: updateAverageRating,
        deleteAfter: updateAverageRating,
    }
});


// ----------- Database ------------------

const connectOptions: MysqlConnectOptions = {
    host: process.env.SQL_HOST || '',
    port: parseInt(process.env.SQL_PORT || '3306'),
    user: process.env.SQL_USER || '',
    password: process.env.SQL_PASSWORD || '',
    database: process.env.SQL_DATABASE || '',
};

const database = new MySqlDatabase(connectOptions, {
    initializeTables: true
});

database.addModels(models);
app.addDatabase(database);


// ---------- Auth ------------------

const auth = new BetterAuth(database, {
    useEmailPassword: true
});

app.setAuthenticator(auth);


// ---------- Start! ------------------
app.start();
// </app>

async function run () {
    //<generate>
    await app.generate({
        entryPath: path.resolve('./src/examples/raw/example-app.ts'),
        outputs: ['./dist/frontend.ts'],
        appName: 'BookMate',
        version: '1.0.0',
        comment: 'This code is generated from src/examples/raw/example-app.ts',
        baseUrl: 'http://localhost:3000',
    });
    //</generate>
}

run();