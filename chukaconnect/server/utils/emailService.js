import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  console.log('\n=== Creating Email Transporter ===');
  console.log('Email Service:', process.env.EMAIL_SERVICE);
  console.log('Email User:', process.env.EMAIL_USER);
  
  // Remove any spaces from the password (in case it was copied with spaces)
  const password = process.env.EMAIL_PASS.replace(/\s+/g, '');
  
  // Gmail SMTP Configuration
  const config = {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: password
    },
    // Add connection timeout and retry settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,   // 5 seconds
    socketTimeout: 10000,    // 10 seconds
    debug: true,             // Enable debug logs
    logger: true,            // Enable built-in logger
    tls: {
      rejectUnauthorized: true, // Verify SSL certificates
      minVersion: 'TLSv1.2'     // Use modern TLS
    },
    maxConnections: 1,       // Limit concurrent connections
    maxMessages: 1,          // Messages per connection
    pool: false             // Disable connection pool
  };

  console.log('SMTP Configuration:', {
    ...config,
    auth: {
      user: config.auth.user,
      pass: '[HIDDEN]'
    }
  });

  return nodemailer.createTransport(config);
};

const verifyTransporter = async (transporter) => {
  console.log('\n=== Verifying Email Transporter ===');
  
  // Retry verification up to 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Verification attempt ${attempt}/3...`);
      const verification = await transporter.verify();
      console.log('Transporter verification successful:', verification);
      return true;
    } catch (error) {
      console.error(`Verification attempt ${attempt} failed:`, error);
      
      if (error.code === 'ECONNRESET') {
        console.log('Connection reset by peer. Retrying...');
        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      if (error.code === 'EAUTH') {
        console.error(`
          Authentication Error: Your Gmail credentials were rejected.
          Please make sure you have:
          1. Enabled 2-Step Verification in your Google Account
          2. Generated an App Password
          3. Used the App Password (not your regular password)
          4. Removed any spaces from the App Password
        `);
        throw error;
      }
      
      // On last attempt, throw the error
      if (attempt === 3) {
        throw new Error(`Email configuration verification failed after ${attempt} attempts: ${error.message}`);
      }
    }
  }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  console.log('\n=== Starting Password Reset Email Process ===');
  console.log('Recipient email:', email);
  
  // Retry sending email up to 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`\nEmail sending attempt ${attempt}/3...`);
      const transporter = createTransporter();
      await verifyTransporter(transporter);
      
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      console.log('Reset URL:', resetUrl);

      const mailOptions = {
        from: {
          name: "ChukaConnect",
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Password Reset Request - ChukaConnect',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #1976d2; text-align: center;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password for your ChukaConnect account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #1976d2; 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 4px; 
                        display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>This link will expire in 15 minutes for security reasons.</p>
            <p>If you didn't request this password reset, you can safely ignore this email - your password will remain unchanged.</p>
            <p>Best regards,<br>The ChukaConnect Team</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">This is an automated email, please do not reply.</p>
          </div>
        `
      };

      console.log('Sending email with options:', {
        from: mailOptions.from,
        to: email,
        subject: mailOptions.subject
      });

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.response);
      console.log('Message ID:', info.messageId);
      
      console.log('\n=== Password Reset Email Process Completed ===');
      return info;
    } catch (error) {
      console.error(`\nEmail sending attempt ${attempt} failed:`, error);
      
      if (error.code === 'ECONNRESET' && attempt < 3) {
        console.log('Connection reset. Waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      if (attempt === 3) {
        console.error('\n=== Password Reset Email Process Failed ===');
        console.error('Error Type:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        
        if (error.code === 'EAUTH') {
          throw new Error('Email authentication failed. Please check your credentials.');
        }
        
        if (error.code === 'ESOCKET') {
          throw new Error('Network error occurred while sending email.');
        }
        
        throw new Error(`Failed to send password reset email after ${attempt} attempts: ${error.message}`);
      }
    }
  }
};
