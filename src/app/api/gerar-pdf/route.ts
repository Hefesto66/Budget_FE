
import { NextRequest, NextResponse } from 'next/server';

// DEPRECATED: This API route is no longer in use.
// The PDF generation logic has been moved to a client-side printing approach
// via the `/orcamento/imprimir` page to avoid server-side instability and complexity.
// This client-side approach is more robust as it leverages the browser's native
// rendering engine, which perfectly handles CSS and modern web features.

export async function POST(req: NextRequest) {
    console.warn("DEPRECATED API: /api/gerar-pdf was called but is no longer supported.");
    return new NextResponse(
        `API Route Deprecated: PDF generation is now handled on the client-side via the /orcamento/imprimir page. This API is no longer used.`, 
        { status: 410 } // 410 Gone
    );
}
