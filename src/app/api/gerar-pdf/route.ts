import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import type { WizardFormData } from '@/components/wizard/Wizard';
import { renderProposalToHtml } from '@/lib/pdf-renderer';


interface ProposalRequestData {
  results: SolarCalculationResult;
  formData: WizardFormData['calculationInput'];
  billOfMaterials: WizardFormData['billOfMaterials'];
  companyData: CompanyFormData;
  clientData: ClientFormData;
  customization: CustomizationSettings;
  proposalId: string;
  proposalDate: string; // ISO string
  proposalValidity: string; // ISO string
}


export async function POST(req: NextRequest) {
  try {
    const props: ProposalRequestData = await req.json();

    const html = renderProposalToHtml({
      ...props,
      // Convert ISO strings back to Date objects for the component
      proposalDate: new Date(props.proposalDate),
      proposalValidity: new Date(props.proposalValidity),
    });

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="proposta-${props.proposalId}.pdf"`,
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
