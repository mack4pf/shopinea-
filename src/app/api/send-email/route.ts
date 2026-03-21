import { NextResponse } from 'next/server';
import { sendEmail, getVerificationEmailHtml, getProductAddedEmailHtml, getDepositDetailsEmailHtml, getPurchaseDetailsEmailHtml, getAdminCustomEmailHtml } from '@/lib/mail';

export async function POST(req: Request) {
    try {
        const { type, to, data, from } = await req.json();

        let subject = '';
        let html = '';

        switch (type) {
            case 'verification':
                subject = 'Action Required: Verify Account';
                html = getVerificationEmailHtml(data.code);
                break;
            case 'product-added':
                subject = 'Products Successfully Deployed - Shoplinea';
                html = getProductAddedEmailHtml(data.userName, data.products);
                break;
            case 'deposit':
                subject = 'Pending Action: Deposit Funding';
                html = getDepositDetailsEmailHtml(data.userName, data.amount, data.method);
                break;
            case 'purchase':
                subject = 'New Sale Completed - Action Required';
                html = getPurchaseDetailsEmailHtml(data.storeName, data.buyerName, data.orderTotal, data.itemNames);
                break;
            case 'custom':
                subject = data.subject || 'Admin Notification - Shoplinea';
                html = getAdminCustomEmailHtml(data.html || 'No content provided.', subject);
                break;
            default:
                return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
        }

        const result = await sendEmail({ to, subject, html, from });

        if (result.error) {
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
