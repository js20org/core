import { App, Model, Schema } from '@js20/core';

const sBook = {};
const sMessage = {};
const app = new App<{ review: Model<any>, book: Model<any> }>();

// <include>
const updateAverageRating = app.action({
    inputSchema: Schema.withInstance(sBook),
    outputSchema: sMessage,
    run: async (system, input) => {
        // Get all reviews for the book, bypassing ACL rules
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
// </include>