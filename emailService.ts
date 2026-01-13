
import emailjs from '@emailjs/browser';

// Replace these with your actual Service ID, Template ID, and Public Key
// or set them in your .env file
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'mock_service_id';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'mock_template_id';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'mock_public_key';
// Helper to save notification locally for the bell icon
const saveLocalNotification = (userId: string, message: string, type: 'info' | 'success' | 'alert') => {
    try {
        const stored = localStorage.getItem('global_notifications');
        const notifications = stored ? JSON.parse(stored) : [];
        const newNotif = {
            id: Math.random().toString(36).substr(2, 9),
            userId,
            message,
            date: new Date().toLocaleTimeString(),
            read: false,
            type
        };
        localStorage.setItem('global_notifications', JSON.stringify([newNotif, ...notifications]));
    } catch (e) {
        console.error("Failed to save local notification", e);
    }
};

export const emailService = {
    sendEmail: async (to_email: string, to_name: string, subject: string, message: string) => {
        if (SERVICE_ID === 'mock_service_id') {
            console.log(`[EmailJS Mock] Sending email to ${to_email}: ${subject} - ${message}`);
            return Promise.resolve({ status: 200, text: 'Mock Success' });
        }

        try {
            const templateParams = {
                to_email,
                to_name,
                subject,
                message,
            };

            const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            return response;
        } catch (error) {
            console.error('EmailJS Error:', error);
            throw error;
        }
    },

    sendNewRequest: async (doctorEmail: string, patientName: string, doctorId: string) => {
        // Save local notification for the doctor
        saveLocalNotification(doctorId, `New appointment request from ${patientName}`, 'info');

        return emailService.sendEmail(
            doctorEmail,
            'Doctor',
            'New Appointment Request',
            `${patientName} has requested a new appointment. Please check your dashboard.`
        );
    },

    sendApptApproved: async (patientEmail: string, patientName: string, doctorName: string, time: string, patientId: string) => {
        // Save local notification for the patient
        saveLocalNotification(patientId, `Appointment with ${doctorName} at ${time} APPROVED`, 'success');

        return emailService.sendEmail(
            patientEmail,
            patientName,
            'Appointment Approved',
            `Your appointment with ${doctorName} at ${time} has been approved.`
        );
    },

    sendQueueAlert: async (patientEmail: string, patientName: string, position: number, patientId: string) => {
        // Save local notification for the patient
        saveLocalNotification(patientId, `QUEUE ALERT: You are #${position} in line!`, 'alert');

        return emailService.sendEmail(
            patientEmail,
            patientName,
            'Queue Update: Come to Hospital',
            `You are currently #${position} in the queue. Please proceed to the hospital immediately.`
        );
    },

    sendPinResetOtp: async (email: string, name: string, otp: string) => {
        console.log(`[Security] Sending OTP ${otp} to ${email}`);
        return emailService.sendEmail(
            email,
            name,
            'Security Verification Code',
            `Your verification code to securely change your medical vault PIN is: ${otp}. Do not share this code.`
        );
    }
};
