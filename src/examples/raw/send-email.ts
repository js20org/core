import { BetterAuth } from '@js20/core';
import type { AuthEmail } from '../../core/types.js';

const database: any = null;

// @ts-ignore
// <include>
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const auth = new BetterAuth(database, {
    useEmailPassword: true,
    sendEmail: async (email: AuthEmail) => {
        const { to, url, subject, text } = email;

        const msg = {
            to,
            from: 'no-reply@yourdomain.com',
            subject,
            text,
            html: `
                <div>
                    <p>${text}</p>
                    ${url ? `
                        <a href="${url}">
                            Open Link
                        </a>` : ''}
                </div>
            `
        };

        await sgMail.send(msg);
    }
});
// </include>
