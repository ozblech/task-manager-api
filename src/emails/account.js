const sgMail = require('@sendgrid/mail')


sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: process.env.EMAIL_ACCOUNT,
        subject: 'Thanks for joining in',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app. Oz Blech`
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: process.env.EMAIL_ACCOUNT,
        subject: 'Task-App cancelled',
        text: `Hello ${name}. We are sorry to hear that you leave us. Please tell us if there is something we could do better for you.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}
