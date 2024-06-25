import sendgrid from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env.local

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  console.log('Handler invoked'); // Log to check if handler is invoked

  if (req.method === 'POST') {
    const {name, email, message} = req.body;
    console.log('Received data:', {name, email, message});

    const msg = {
      to: process.env.CONTACT_EMAIL, // Your email address
      from: process.env.CONTACT_EMAIL, // Your email address (must be verified on SendGrid)
      subject: `Contact form submission from ${name}`,
      text: message,
      html: `<strong>Name:</strong> ${name}<br><strong>Email:</strong> ${email}<br><strong>Message:</strong><p>${message}</p>`,
    };

    try {
      console.log('Sending email:', msg); // Log email content
      const response = await sendgrid.send(msg);
      console.log('SendGrid response:', response); // Log SendGrid response
      res.status(200).json({message: 'Email sent successfully'});
    } catch (error) {
      console.error('Error sending email:', error); // Log full error
      res.status(500).json({message: 'Failed to send email', error: error.response ? error.response.body : error.message});
    }
  } else {
    console.log('Method not allowed'); // Log for non-POST methods
    res.status(405).json({message: 'Method not allowed'});
  }
}
