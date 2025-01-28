// This is a placeholder SMS service
// In production, you would integrate with a real SMS provider like Twilio

export const sendSMS = async (phoneNumber, message) => {
  console.log('\n=== Simulating SMS Send ===');
  console.log('To:', phoneNumber);
  console.log('Message:', message);
  
  // In development, just log the message
  if (process.env.NODE_ENV === 'development') {
    return Promise.resolve({
      success: true,
      message: 'SMS simulated in development mode'
    });
  }
  
  // In production, you would integrate with a real SMS service
  // Example with Twilio:
  /*
  const twilioClient = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  return twilioClient.messages.create({
    body: message,
    to: phoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER
  });
  */
  
  throw new Error('SMS service not configured for production');
};
