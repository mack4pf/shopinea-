import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@shoplinea.shop';
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'support@shoplinea.shop';
const DEFAULT_FROM_NAME = process.env.RESEND_FROM_NAME || 'Shopinea Support';
const defaultFrom = `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`;
const resend = new Resend(RESEND_API_KEY);

export async function sendEmail({
    to,
    subject,
    html,
    from = defaultFrom,
}: {
    to: string;
    subject: string;
    html: string;
    from?: string;
}) {
    try {
        if (!RESEND_API_KEY) {
            return { error: new Error('RESEND_API_KEY is not configured.') };
        }
        if (!to || !subject || !html) {
            return { error: new Error('Email requires to, subject, and html.') };
        }

        const { data, error } = await resend.emails.send({
            from,
            to,
            subject,
            html,
            replyTo: SUPPORT_EMAIL,
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

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 0; }
    .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0284c7 0%, #65a30d 100%); padding: 32px 40px; text-align: left; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0 0; color: #a1a1aa; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 40px; }
    .content h2 { color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 24px 0; letter-spacing: -0.5px; }
    .content p { color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; }
    .footer { padding: 32px 40px; text-align: left; border-top: 1px solid #e5e7eb; background-color: #f9fafb; }
    .footer p { margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: #f3f4f6; color: #374151; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
    .button { display: inline-block; background-color: #050505; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 8px; }
</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Shoplinea</h1>
            <p>Merchant Portal</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p><strong>Shoplinea</strong><br/>
            This email was sent automatically by Shopinea Support. Reply to ${SUPPORT_EMAIL}.<br/>
            &copy; 2026 Shoplinea.shop. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const getVerificationEmailHtml = (code: string) => baseTemplate(`
    <span class="badge" style="margin-bottom: 16px;">Security Verification</span>
    <h2>Verification Code</h2>
    <p>We received a request to verify your account. Please use the verification code below to proceed.</p>
    
    <div class="box" style="text-align: center; border-color: #2563eb; background-color: #eff6ff;">
        <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #2563eb; margin-bottom: 8px; letter-spacing: 1px;">Verification Code</p>
        <span style="font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a;">${code}</span>
    </div>
    
    <p style="font-size: 13px; color: #6b7280;">If you did not initiate this request, please contact Shoplinea Support immediately.</p>
`);

export const getProductAddedEmailHtml = (userName: string, products: any[]) => baseTemplate(`
    <span class="badge" style="margin-bottom: 16px;">Products Added</span>
    <h2>Products Successfully Linked</h2>
    <p>Hello ${userName},</p>
    <p>We have successfully linked new products to your store. Your inventory reflects the following additions:</p>
    
    <div class="box" style="padding: 0;">
        ${products.map((p, i) => `
            <div style="padding: 16px 24px; border-bottom: ${i === products.length - 1 ? 'none' : '1px solid #e5e7eb'}; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: #111827; font-size: 15px;">${p.name}</strong>
                    <div style="color: #6b7280; font-size: 13px; margin-top: 4px;">Cost: <span style="font-family: monospace;">$${p.price}</span></div>
                </div>
                <div style="text-align: right;">
                    <span style="display: inline-block; background: #ecfdf5; color: #047857; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;">READY</span><br/>
                    <strong style="color: #111827; font-size: 15px;">$${p.resellPrice}</strong>
                </div>
            </div>
        `).join('')}
    </div>
    
    <p>Your supplier connections have been updated. When a buyer checks out on your store, fulfillment will be managed automatically.</p>
    <a href="https://shoplinea.shop/dashboard" style="color: white" class="button">Access Dashboard</a>
`);

export const getPurchaseDetailsEmailHtml = (storeName: string, buyerName: string, orderTotal: number, itemNames: string) => baseTemplate(`
    <span class="badge" style="background-color: #dcfce7; color: #166534; margin-bottom: 16px;">New Order</span>
    <h2>New Sale Completed!</h2>
    <p>Congratulations, ${storeName}.</p>
    <p>A buyer (<strong>${buyerName}</strong>) has just completed a transaction on your store.</p>
    
    <div class="box" style="border-left: 4px solid #10b981;">
        <p style="margin: 0; font-size: 14px; font-weight: 500; color: #4b5563; margin-bottom: 12px;"><strong>Ordered Items:</strong> ${itemNames}</p>
        <p style="margin: 0; font-size: 28px; font-weight: 800; color: #111827;">Total: $${orderTotal.toLocaleString()}</p>
    </div>
    
    <p>The payment has been secured and the fulfillment team has been notified. <strong>Log into your dashboard to manage shipment and collect your profit.</strong></p>
    <a href="https://shoplinea.shop/dashboard/orders" style="color: white" class="button">View Order</a>
`);

export const getDepositDetailsEmailHtml = (userName: string, amount: number, method: string) => {
    const addresses = {
        crypto: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F (USDT BEP20/ERC20)",
        paypal: "payments@shoplinea.shop",
        card: "payments@shoplinea.shop"
    };
    
    return baseTemplate(`
        <span class="badge" style="margin-bottom: 16px;">Wallet Funding</span>
        <h2>Pending Action: Wallet Deposit</h2>
        <p>Hello ${userName},</p>
        <p>You have initiated a deposit to fund your marketing wallet. Your request for <strong>$${amount}</strong> is currently pending processing via <strong>${method.toUpperCase()}</strong>.</p>
        
        <div class="box" style="background-color: #fafafa;">
            <p style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Payment Details</p>
            <p style="margin: 0; font-family: monospace; font-size: 16px; font-weight: 700; color: #111827; word-break: break-all;">
                ${(addresses as any)[method] || addresses.crypto}
            </p>
        </div>
        
        <p style="font-size: 13px; color: #b91c1c; font-weight: 600;">Action Required: Send exactly $${amount}. Returning to the dashboard and clicking "I'VE SENT PAYMENT" initiates the verification process.</p>
        <p style="font-size: 13px; color: #6b7280;">Payment verification usually takes up to 10 minutes.</p>
    `);
};

export const getAdminCustomEmailHtml = (customBody: string, subjectTitle: string) => baseTemplate(`
    <span class="badge" style="background-color: #fce7f3; color: #9d174d; margin-bottom: 16px;">Notification</span>
    <h2>${subjectTitle}</h2>
    
    <div style="font-size: 15px; color: #374151; line-height: 1.6; padding-top: 10px;">
        ${customBody.split('\n').map(p => `<p>${p}</p>`).join('')}
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 13px; color: #6b7280; margin: 0;">This email was sent by the Shoplinea Support Team.</p>
    </div>
`);
