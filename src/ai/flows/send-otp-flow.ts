
'use server';
/**
 * @fileOverview An AI agent for sending OTP emails.
 *
 * - sendOtp - A function that handles sending the OTP email.
 * - SendOtpInput - The input type for the sendOtp function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import nodemailer from 'nodemailer';
import 'dotenv/config'

const SendOtpInputSchema = z.object({
  email: z.string().email().describe("The recipient's email address."),
  otp: z.string().describe("The 6-digit one-time password."),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

export async function sendOtp(input: SendOtpInput): Promise<{ success: boolean; message: string }> {
  return sendOtpFlow(input);
}

const sendOtpFlow = ai.defineFlow(
  {
    name: 'sendOtpFlow',
    inputSchema: SendOtpInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async (input) => {
    const { email, otp } = input;

    const transporter = nodemailer.createTransport({
      service: 'gmail', // Or your preferred email service
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Your OTP for Raghav Tailors & Fabrics`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #4A0082;">Raghav Tailors & Fabrics Login</h2>
            <p>Hello,</p>
            <p>Your One-Time Password (OTP) to log in is:</p>
            <p style="font-size: 24px; font-weight: bold; color: #4A0082; letter-spacing: 2px; border: 1px dashed #ddd; padding: 10px; display: inline-block;">${otp}</p>
            <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
            <p>If you did not request this, please ignore this email.</p>
            <br/>
            <p>Best regards,</p>
            <p><strong>Raghav Tailors & Fabrics</strong></p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true, message: 'OTP sent successfully.' };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return { success: false, message: `Failed to send OTP: ${error.message}` };
    }
  }
);
