import nodemailer from 'nodemailer';

// Email configuration
const createTransporter = () => {
  // For development, we'll use a test account
  // For production, you should configure with your email provider
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export interface WelcomeEmailData {
  studentName: string;
  studentEmail: string;
  collegeRollNo: string;
  parentEmail: string;
}

export const sendWelcomeEmail = async (data: WelcomeEmailData): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    // Send email to student
    const studentEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
          .button { background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Student Attendance System</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.studentName}!</h2>
            <p>Welcome to our Student Attendance & Automation System. Your account has been successfully created.</p>
            
            <h3>Your Account Details:</h3>
            <ul>
              <li><strong>Roll Number:</strong> ${data.collegeRollNo}</li>
              <li><strong>Email:</strong> ${data.studentEmail}</li>
            </ul>
            
            <h3>What's Next?</h3>
            <ul>
              <li>🎯 Set up face recognition for automated attendance</li>
              <li>📅 View your attendance history and statistics</li>
              <li>💬 Connect with classmates in the chat room</li>
              <li>📚 Track your syllabus progress</li>
              <li>📋 Check exam schedules and calendar events</li>
            </ul>
            
            <p>Start by logging in and setting up your face recognition profile for seamless attendance marking.</p>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to parent
    const parentEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Student Account Notification</h1>
          </div>
          <div class="content">
            <h2>Dear Parent/Guardian,</h2>
            <p>Your child has been successfully registered in our Student Attendance & Automation System.</p>
            
            <h3>Student Details:</h3>
            <ul>
              <li><strong>Name:</strong> ${data.studentName}</li>
              <li><strong>Roll Number:</strong> ${data.collegeRollNo}</li>
              <li><strong>Student Email:</strong> ${data.studentEmail}</li>
            </ul>
            
            <h3>System Features:</h3>
            <ul>
              <li>📊 Real-time attendance tracking</li>
              <li>🔐 Secure face recognition technology</li>
              <li>📱 Mobile-friendly interface</li>
              <li>📈 Attendance statistics and reports</li>
              <li>📅 Academic calendar integration</li>
            </ul>
            
            <p>You will receive regular updates about your child's attendance and academic activities.</p>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>For any queries, please contact the college administration.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails concurrently
    await Promise.all([
      transporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@college.edu',
        to: data.studentEmail,
        subject: 'Welcome to Student Attendance System - Account Created Successfully',
        html: studentEmailHtml,
      }),
      transporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@college.edu',
        to: data.parentEmail,
        subject: 'Student Account Created - Attendance System Notification',
        html: parentEmailHtml,
      })
    ]);

    console.log(`Welcome emails sent successfully to ${data.studentEmail} and ${data.parentEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome emails:', error);
    return false;
  }
};

export const sendAttendanceNotification = async (
  studentEmail: string,
  parentEmail: string,
  studentName: string,
  status: string,
  subject?: string,
  date?: Date
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const formattedDate = date ? date.toLocaleDateString() : new Date().toLocaleDateString();
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${status === 'present' ? '#10b981' : '#ef4444'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
          .status { font-size: 24px; font-weight: bold; text-transform: uppercase; }
          .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Attendance Notification</h1>
            <div class="status">${status}</div>
          </div>
          <div class="content">
            <h2>Attendance Update for ${studentName}</h2>
            <p>This is to inform you about the attendance status:</p>
            
            <ul>
              <li><strong>Date:</strong> ${formattedDate}</li>
              <li><strong>Status:</strong> ${status.toUpperCase()}</li>
              ${subject ? `<li><strong>Subject:</strong> ${subject}</li>` : ''}
              <li><strong>Time:</strong> ${new Date().toLocaleTimeString()}</li>
            </ul>
            
            <div class="footer">
              <p>This is an automated attendance notification.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@college.edu',
      to: [studentEmail, parentEmail],
      subject: `Attendance Alert: ${studentName} - ${status.toUpperCase()} (${formattedDate})`,
      html: emailHtml,
    });

    console.log(`Attendance notification sent to ${studentEmail} and ${parentEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending attendance notification:', error);
    return false;
  }
};