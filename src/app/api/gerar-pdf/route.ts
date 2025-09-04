
import { NextRequest, NextResponse } from 'next/server';

// DEPRECATED: This API route is no longer in use.
// The PDF generation logic has been moved to a client-side printing approach
// via the `/orcamento/imprimir` page to avoid server-side instability.
// All previous attempts (Puppeteer, html2canvas on server) have failed due
// to fundamental environment limitations.

export async function POST(req: NextRequest) {
    console.warn("DEPRECATED API: /api/gerar-pdf was called but is no longer supported.");
    return new NextResponse(
        `API Rota Obsoleta: A geração de PDF agora é feita no lado do cliente. Esta API não é mais usada.`, 
        { status: 410 } // 410 Gone
    );
}

    