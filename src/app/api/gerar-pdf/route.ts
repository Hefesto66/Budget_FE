
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Determine the Netlify function URL. In development, it might be different.
    const functionUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:9999/.netlify/functions/gemini' 
      : `${process.env.URL}/.netlify/functions/gemini`;

    // Forward the request to the Netlify serverless function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Netlify function returned an error.');
    }

    const pdfBuffer = await response.arrayBuffer();

    // Return the PDF buffer received from the Netlify function
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${body.proposalId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('==================== PDF PROXY Error ====================');
    console.error(error);
    console.error('==============================================================');
    return new NextResponse(JSON.stringify({ error: 'Failed to proxy PDF request', details: error.message }), { status: 500 });
  }
}
