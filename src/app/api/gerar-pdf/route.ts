
require('dotenv').config();
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Use an explicit environment variable for the Netlify function URL.
    const functionUrl = process.env.NETLIFY_FUNCTION_URL;

    if (!functionUrl) {
        throw new Error("A URL da função Netlify (NETLIFY_FUNCTION_URL) não está configurada.");
    }
    
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
      throw new Error(errorData.details || 'A função Netlify retornou um erro.');
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
