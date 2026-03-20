import { NextResponse } from 'next/server';
import { sendEmail, getVerificationEmailHtml, getProductAddedEmailHtml, getDepositDetailsEmailHtml } from '@/lib/mail';

export async function POST(req: Request) {
    try {
        const { type, to, data } = await req.json();

        let subject = '';
        let html = '';

        switch (type) {
            case 'verification':
                subject = 'Verification Code - Shoplinea.shop';
                html = getVerificationEmailHtml(data.code);
                break;
            case 'product-added':
                subject = 'Products Added to Your Store - Shoplinea';
                html = getProductAddedEmailHtml(data.userName, data.products);
                break;
            case 'deposit':
                subject = 'Deposit Details - Verification Pending';
                html = getDepositDetailsEmailHtml(data.userName, data.amount, data.method);
                break;
            case 'custom':
                subject = data.subject || 'Admin Notification - Shoplinea';
                html = data.html || '<p>No content provided.</p>';
                break;
            default:
                return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
        }

        const result = await sendEmail({ to, subject, html });

        if (result.error) {
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
