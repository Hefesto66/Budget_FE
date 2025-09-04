
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
  try {
    // We receive the already-rendered HTML string from the client
    const { htmlContent, proposalId } = await req.json();

    if (!htmlContent) {
      return new NextResponse('Corpo da requisição inválido: htmlContent é obrigatório.', { status: 400 });
    }

    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    // Set content directly from the string provided by the client
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm',
      }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${proposalId || 'custom'}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    // Ensure the error is a string for the response
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new NextResponse(
        `Falha ao gerar o PDF: ${errorMessage}`, 
        { status: 500 }
    );
  }
}
