import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_123');

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'noreply@shoplinea.shop',
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Resend error:', error);
            return { error };
        }

        return { data };
    } catch (error) {
        console.error('Email sending error:', error);
        return { error };
    }
}

// Template for Verification Code
export const getVerificationEmailHtml = (code: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 20px;">
        <h2 style="color: #2563eb; text-align: center; font-weight: 900;">Shoplinea.shop</h2>
        <div style="padding: 20px; text-align: center;">
            <p style="font-size: 16px; color: #4b5563;">Your registration verification code is:</p>
            <h1 style="font-size: 48px; font-weight: 900; letter-spacing: 10px; color: #111827; margin: 20px 0;">${code}</h1>
            <p style="font-size: 14px; color: #9ca3af;">Please enter this code on the registration page. If you didn't request this, please ignore this email.</p>
            <p style="font-size: 14px; font-weight: bold; color: #ef4444; margin-top: 20px;">Note: If you don't see the email, please check your SPAM folder.</p>
        </div>
        <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
            &copy; 2026 Shoplinea.shop. All rights reserved.
        </div>
    </div>
`;

// Template for Product Added
export const getProductAddedEmailHtml = (userName: string, products: any[]) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #2563eb; font-weight: 900;">Products Added to your Store!</h2>
        <p>Hi ${userName},</p>
        <p>The following products from our <strong>Premium Sourcing Network</strong> have been successfully added to your store:</p>
        <ul style="list-style: none; padding: 0;">
            ${products.map(p => `
                <li style="padding: 15px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center;">
                    <div style="flex: 1;">
                        <span style="font-weight: bold; color: #111827;">${p.name}</span><br/>
                        <span style="font-size: 12px; color: #6b7280;">B2B Price: $${p.price} | Retail: $${p.resellPrice}</span>
                    </div>
                </li>
            `).join('')}
        </ul>
        <p style="margin-top: 20px;">Our global suppliers have been notified of your intent to resell. You can now start running ads for these products.</p>
        <div style="background: #f9fafb; padding: 15px; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">Need supplier contact details? They will be shared once your first order is processed or upon verification.</p>
        </div>
    </div>
`;

// Template for Deposit Details
export const getDepositDetailsEmailHtml = (userName: string, amount: number, method: string) => {
    const addresses = {
        crypto: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F (USDT BEP20/ERC20)",
        paypal: "payments@shoplinea.shop",
        card: "payments@shoplinea.shop"
    };
    
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #2563eb; font-weight: 900;">Deposit Details - Pending Verification</h2>
            <p>Hi ${userName},</p>
            <p>You have initiated an ad deposit of <strong>$${amount}</strong> via <strong>${method.toUpperCase()}</strong>.</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 20px; border: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Payment Address</p>
                <div style="font-family: monospace; font-size: 16px; font-weight: bold; color: #111827; background: white; padding: 15px; border-radius: 10px; word-break: break-all;">
                    ${(addresses as any)[method] || addresses.crypto}
                </div>
            </div>
            <p style="font-size: 14px; font-weight: bold; color: #ef4444;">Important: Send exactly the amount specified. Once paid, click 'I'VE SENT PAYMENT' in the dashboard.</p>
            <p style="font-size: 12px; color: #6b7280;">Our nodes verify payments every 10 minutes. Your bonus will be added immediately upon confirmation.</p>
        </div>
    `;
};
