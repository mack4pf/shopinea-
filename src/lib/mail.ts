import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_123');

export async function sendEmail({
    to,
    subject,
    html,
    from = 'Shoplinea <support@shoplinea.shop>',
}: {
    to: string;
    subject: string;
    html: string;
    from?: string;
}) {
    try {
        const { data, error } = await resend.emails.send({
            from,
            to,
            subject,
            html,
            replyTo: 'support@shoplinea.shop',
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
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #070711; margin: 0; padding: 36px 0; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28); }
    .header { background: linear-gradient(135deg, #080814 0%, #111827 45%, #312e81 100%); padding: 34px 40px; text-align: left; }
    .header h1 { margin: 0; color: #ffffff; font-size: 23px; font-weight: 850; letter-spacing: -0.6px; }
    .header p { margin: 8px 0 0 0; color: #c4b5fd; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.8px; }
    .content { padding: 40px; }
    .content h2 { color: #0f172a; font-size: 28px; font-weight: 850; margin: 0 0 18px 0; letter-spacing: -0.8px; line-height: 1.08; }
    .content p { color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 18px 0; }
    .footer { padding: 28px 40px; text-align: left; border-top: 1px solid #e2e8f0; background-color: #f8fafc; }
    .footer p { margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.55; }
    .badge { display: inline-block; padding: 6px 11px; border-radius: 9999px; background-color: #eef2ff; color: #4338ca; font-size: 11px; font-weight: 850; text-transform: uppercase; letter-spacing: 0.8px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; margin-bottom: 22px; }
    .button { display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 13px 22px; border-radius: 10px; font-weight: 800; font-size: 14px; margin-top: 8px; }
    .ai-row { display: table; width: 100%; border-spacing: 8px 0; margin: 18px -8px 24px; }
    .ai-pill { display: table-cell; width: 50%; background: #0f172a; color: #ffffff; border-radius: 14px; padding: 14px 16px; font-size: 13px; font-weight: 850; }
    .metric { display: inline-block; margin: 0 8px 8px 0; padding: 10px 12px; border-radius: 12px; background: #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 750; }
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
            This email was sent automatically by Shoplinea Support.<br/>
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

export const getAdCampaignSubmittedEmailHtml = (userName: string, platform: string, budget: number) => baseTemplate(`
    <span class="badge" style="margin-bottom: 16px;">Agentic Ads Queue</span>
    <h2>Your ads are being prepared</h2>
    <p>Hello ${userName},</p>
    <p>Your ${platform.toUpperCase()} campaign has entered the Shopinea agentic ad queue. Claude.ai and Open Claw AI are preparing the audience map, creative angle, and launch checks while ${platform.toUpperCase()} reviews the campaign.</p>
    <div class="ai-row">
        <div class="ai-pill">Claude.ai<br/><span style="color:#a5b4fc;font-size:11px;">Creative strategy</span></div>
        <div class="ai-pill">Open Claw AI<br/><span style="color:#a5b4fc;font-size:11px;">Campaign execution</span></div>
    </div>
    <div class="box">
        <span class="metric">Platform: ${platform.toUpperCase()}</span>
        <span class="metric">Budget: $${Number(budget || 0).toLocaleString()}</span>
        <span class="metric">Status: ${platform.toUpperCase()} preparing</span>
    </div>
    <p>Please wait a few hours while ${platform.toUpperCase()} prepares and approves the campaign. We will email you again once the AI launch agents begin running delivery.</p>
    <a href="https://shoplinea.shop/dashboard/ads" style="color: white" class="button">Open Ads Dashboard</a>
`);

export const getAdCampaignApprovedEmailHtml = (userName: string, platform: string, budget: number) => baseTemplate(`
    <span class="badge" style="background:#dcfce7;color:#166534;margin-bottom:16px;">Campaign Live</span>
    <h2>Claude.ai + Open Claw AI have started your ads</h2>
    <p>Hello ${userName},</p>
    <p>Your ${platform.toUpperCase()} ad campaign has been approved. The Shopinea agentic ad engine is now launching your campaign, monitoring early traffic, and preparing optimization signals.</p>
    <div class="ai-row">
        <div class="ai-pill">Claude.ai<br/><span style="color:#a5b4fc;font-size:11px;">Angles, copy, audience intent</span></div>
        <div class="ai-pill">Open Claw AI<br/><span style="color:#a5b4fc;font-size:11px;">Launch pacing, delivery checks</span></div>
    </div>
    <div class="box" style="border-left:4px solid #22c55e;">
        <span class="metric">Platform: ${platform.toUpperCase()}</span>
        <span class="metric">Budget: $${Number(budget || 0).toLocaleString()}</span>
        <span class="metric">Status: Live</span>
    </div>
    <p>Keep an eye on impressions, clicks, and audience locations from your ads dashboard.</p>
    <a href="https://shoplinea.shop/dashboard/ads" style="color: white" class="button">Track Campaign</a>
`);

export const getWinningProductAdPromptEmailHtml = (userName: string, productName: string) => baseTemplate(`
    <span class="badge" style="background:#fef3c7;color:#92400e;margin-bottom:16px;">Sales Signal</span>
    <h2>${productName || "One of your products"} is ready for ads</h2>
    <p>Hello ${userName},</p>
    <p>Our agentic AI noticed a product in your store has been performing well over the last 2 months. This is the right time to push it with paid traffic before the trend cools down.</p>
    <div class="box">
        <span class="metric">Signal: Strong sales</span>
        <span class="metric">Window: Last 2 months</span>
        <span class="metric">Action: Run ads now</span>
    </div>
    <p>Claude.ai can shape the campaign angle while Open Claw AI handles launch pacing and audience checks.</p>
    <a href="https://shoplinea.shop/dashboard/ads" style="color: white" class="button">Start Ads</a>
`);

export const getPlanUpgradePromptEmailHtml = (userName: string) => baseTemplate(`
    <span class="badge" style="background:#fce7f3;color:#9d174d;margin-bottom:16px;">Growth Unlock</span>
    <h2>Your store is ready for a higher plan</h2>
    <p>Hello ${userName},</p>
    <p>Your account is reaching the point where more products, stronger analytics, and AI recommendations can help you scale faster. Upgrade your plan to unlock the full Shopinea growth stack.</p>
    <div class="box">
        <span class="metric">More active products</span>
        <span class="metric">Advanced analytics</span>
        <span class="metric">AI product recommendations</span>
    </div>
    <p>The next plan gives your store more room to grow and lets the agentic AI layer work harder for your sales.</p>
    <a href="https://shoplinea.shop/dashboard/subscription" style="color: white" class="button">Upgrade Account</a>
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

export const getAdminCustomEmailHtml = (customBody: string, subjectTitle: string) => {
    const body = /<\/?[a-z][\s\S]*>/i.test(customBody)
        ? customBody
        : customBody.split('\n').map(p => `<p>${p}</p>`).join('');

    return baseTemplate(`
    <span class="badge" style="background-color: #fce7f3; color: #9d174d; margin-bottom: 16px;">Notification</span>
    <h2>${subjectTitle}</h2>
    
    <div style="font-size: 15px; color: #374151; line-height: 1.6; padding-top: 10px;">
        ${body}
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 13px; color: #6b7280; margin: 0;">This email was sent by the Shoplinea Support Team.</p>
    </div>
`);
};
