// server/emailService.ts
import nodemailer from "nodemailer";

export const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail", // using Gmail shorthand; change if you use another provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    logger: true,
    debug: true,
  });

// typed normalized result for all email functions
export type EmailSendResult = {
  success: boolean;
  error?: any;
  studentInfo?: any; // raw nodemailer response for student email (optional)
  parentInfo?: any;  // raw nodemailer response for parent / admin email (optional)
};

// -------------------- WELCOME EMAIL --------------------
export interface WelcomeEmailData {
  studentName: string;
  studentEmail: string;
  collegeRollNo: string;
  parentEmail: string;
}

export const sendWelcomeEmail = async (data: WelcomeEmailData): Promise<EmailSendResult> => {
  const transporter = createTransporter();
  try {
    // verify connection/auth — will throw if credentials wrong
    await transporter.verify();

    const studentEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Welcome</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 18px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; margin-top: 18px; font-size: 13px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Student Attendance System</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.studentName}!</h2>
            <p>Your account has been created successfully.</p>
            <h3>Your Account Details:</h3>
            <ul>
              <li><strong>Roll Number:</strong> ${data.collegeRollNo}</li>
              <li><strong>Email:</strong> ${data.studentEmail}</li>
            </ul>
            <p>Start by logging in and setting up face recognition for automated attendance.</p>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const parentEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Student Account Created</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 18px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; margin-top: 18px; font-size: 13px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Student Account Notification</h1>
          </div>
          <div class="content">
            <h2>Dear Parent/Guardian,</h2>
            <p>Your child <strong>${data.studentName}</strong> has been registered successfully.</p>
            <ul>
              <li><strong>Roll Number:</strong> ${data.collegeRollNo}</li>
              <li><strong>Student Email:</strong> ${data.studentEmail}</li>
            </ul>
            <p>You will receive attendance updates and notifications from the system.</p>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // send both concurrently and return raw nodemailer responses
    const [studentInfo, parentInfo] = await Promise.all([
      transporter.sendMail({
        from: process.env.EMAIL_USER || "noreply@college.edu",
        to: data.studentEmail,
        subject: "🎉 Welcome to Student Attendance System",
        html: studentEmailHtml,
      }),
      transporter.sendMail({
        from: process.env.EMAIL_USER || "noreply@college.edu",
        to: data.parentEmail,
        subject: "📢 Your Child Registered in Attendance System",
        html: parentEmailHtml,
      }),
    ]);

    return { success: true, studentInfo, parentInfo };
  } catch (error) {
    console.error("sendWelcomeEmail error:", error);
    return { success: false, error };
  }
};

// -------------------- FEEDBACK EMAIL --------------------
export interface FeedbackEmailData {
  name: string;
  email: string;
  description: string;
}

export const sendFeedbackEmail = async (data: FeedbackEmailData): Promise<EmailSendResult> => {
  const transporter = createTransporter();
  try {
    await transporter.verify();

    const adminTo = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const adminHtml = `
      <h2>New Feedback Received</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Message:</strong><br/>${data.description}</p>
    `;
    const userHtml = `
      <p>Hi ${data.name},</p>
      <p>Thank you for your feedback. We have received your message and will respond if necessary.</p>
      <p>Best regards,<br/>Admin Team</p>
    `;

    const [adminInfo, userInfo] = await Promise.all([
      transporter.sendMail({
        from: process.env.EMAIL_USER || "noreply@college.edu",
        to: adminTo,
        subject: `📩 Feedback from ${data.name}`,
        html: adminHtml,
      }),
      transporter.sendMail({
        from: process.env.EMAIL_USER || "noreply@college.edu",
        to: data.email,
        subject: "✅ Feedback Received",
        html: userHtml,
      }),
    ]);

    return { success: true, studentInfo: userInfo, parentInfo: adminInfo };
  } catch (error) {
    console.error("sendFeedbackEmail error:", error);
    return { success: false, error };
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