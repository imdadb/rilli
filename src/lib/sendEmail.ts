import emailjs from '@emailjs/browser';

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  
  // If EmailJS is not configured, log the verification link to console
  if (!serviceId || !templateId || !publicKey) {
    const verifyLink = `${window.location.origin}/verify?e=${encodeURIComponent(to)}&t=${token}`;
    console.log('📧 Verification Email (EmailJS not configured):');
    console.log(`To: ${to}`);
    console.log(`Verification Link: ${verifyLink}`);
    console.log('Please click the link above to verify your email and set your password.');
    return;
  }
  
  const verifyLink = `${window.location.origin}/verify?e=${encodeURIComponent(to)}&t=${token}`;
  
  try {
    await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: to,
        verify_link: verifyLink,
        token: token
      },
      publicKey
    );
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
    // Fallback to console log if email sending fails
    console.log('📧 Verification Email (Fallback):');
    console.log(`To: ${to}`);
    console.log(`Verification Link: ${verifyLink}`);
    throw error;
  }
}