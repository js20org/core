# Auth emails
$$ meta:title JS20 - Auth emails
$$ meta:description Learn about auth emails in JS20 for user verification and security.

Auth emails are used for verifying emails on signup and password reset. You can send emails by providing a **sendEmail** function in the **Authenticator** config.

$$ import src/core/types.ts#authConfig

Here is an example of a simple **sendEmail** function using **sendgrid**:
$$ import ./src/examples/raw/send-email.ts
