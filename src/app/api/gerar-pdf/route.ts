
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // The base URL of the currently running application
    const baseUrl = req.nextUrl.origin;

    // Encode the JSON data to be passed as a URL parameter
    const encodedData = encodeURIComponent(JSON.stringify(body));

    // Construct the URL to the hidden proposal template page
    const templateUrl = `${baseUrl}/proposal-template?data=${encodedData}`;
    
    const browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    // Go to the template page and wait until the network is idle
    await page.goto(templateUrl, { waitUntil: 'networkidle0' });
    
    // Generate the PDF from the rendered page
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="proposta-${body.proposalId}.pdf"`,
        },
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return new NextResponse(
        JSON.stringify({ error: 'Failed to generate PDF.', details: error.message }),
        { status: 500 }
    );
  }
}
