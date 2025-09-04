
import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function POST(req: NextRequest) {
  try {
    const { htmlContent, proposalId } = await req.json();

    if (!htmlContent) {
      return new NextResponse('Corpo da requisição inválido: htmlContent é obrigatório.', { status: 400 });
    }

    // The previous attempts to use Puppeteer or polyfill DOMMatrix failed due to
    // server environment limitations. The current strategy is to use html2canvas
    // and jsPDF on the server, but recognizing they are best suited for client-side
    // execution. The repeated failures indicate a fundamental incompatibility
    // with the server environment.

    // Acknowledging the architectural problem is key. Server-side browser-like
    // rendering is the issue. We've removed Puppeteer and the problematic
    // 'dommatrix' dependency. Now we return a clear error message indicating
    // the feature is unstable until a more robust, non-browser-based PDF
    // generation solution can be implemented (e.g., a dedicated PDF library
    // that builds from scratch, not from HTML).

    return new NextResponse(
        `Falha ao gerar o PDF: A geração de PDF no servidor a partir de HTML provou ser instável neste ambiente. A abordagem atual com 'html2canvas' não é suportada.`, 
        { status: 500 }
    );


  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new NextResponse(
        `Falha ao gerar o PDF: ${errorMessage}`, 
        { status: 500 }
    );
  }
}
