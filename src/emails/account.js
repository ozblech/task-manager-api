const sgMail = require('@sendgrid/mail')


sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = async (email, name) => {
    try {
        await sgMail.send({
            to: email,
            from: process.env.EMAIL_ACCOUNT,
            subject: 'Thanks for joining in',
            text: `Welcome to the app, ${name}. Let me know how you get along with the app. Oz Blech`
        });
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // You can inspect error.response.body for details if needed
    }
};
const sendCancelEmail  = async (email, name) => {
    try {
        await sgMail.send({
            to: email,
            from: process.env.EMAIL_ACCOUNT,
            subject: 'Task-App cancelled',
            text: `Hello ${name}. We are sorry to hear that you leave us. Please tell us if there is something we could do better for you.`
        });
    } catch (error) {
        console.error('Error sending cancellation email:', error);
        // Handle the error appropriately, e.g., log it or notify an admin
    }
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}
