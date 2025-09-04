
import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// This is a workaround for a jsdom dependency issue in html2canvas with Next.js server environments
global.DOMMatrix = require('dommatrix');

export async function POST(req: NextRequest) {
  try {
    const { htmlContent, proposalId } = await req.json();

    if (!htmlContent) {
      return new NextResponse('Corpo da requisição inválido: htmlContent é obrigatório.', { status: 400 });
    }

    // Create a temporary element to render the HTML
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);

    // Give it a defined size for rendering
    element.style.width = '210mm'; // A4 width
    element.style.position = 'fixed';
    element.style.left = '-210mm'; // Move it off-screen


    const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: true,
        allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const canvasPdfWidth = pdfWidth;
    const canvasPdfHeight = canvasPdfWidth / ratio;

    let position = 0;
    let heightLeft = imgHeight * (pdfWidth / imgWidth); // Total height of the image in PDF units

    pdf.addImage(imgData, 'PNG', 0, position, canvasPdfWidth, heightLeft);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - (imgHeight * (pdfWidth / imgWidth));
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, canvasPdfWidth, imgHeight * (pdfWidth / imgWidth));
      heightLeft -= pdfHeight;
    }

    const pdfBuffer = pdf.output('arraybuffer');
    
    // Clean up the temporary element
    document.body.removeChild(element);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${proposalId || 'custom'}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new NextResponse(
        `Falha ao gerar o PDF: ${errorMessage}`, 
        { status: 500 }
    );
  }
}
