// /src/app/proposal-template/page.tsx
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import type { WizardFormData } from '@/components/wizard/Wizard';

interface ProposalData {
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

// This is a special page that is not meant to be navigated to directly by the user.
// It acts as a server-side template to render the HTML for the PDF.
export default function ProposalTemplatePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const encodedData = searchParams?.data;

  if (typeof encodedData !== 'string') {
    return <div>Error: No data provided.</div>;
  }

  try {
    const decodedData = decodeURIComponent(encodedData);
    const props: ProposalData = JSON.parse(decodedData);

    // Render the document component with the provided props
    return (
      <ProposalDocument
        {...props}
        // Convert ISO strings back to Date objects for the component
        proposalDate={new Date(props.proposalDate)}
        proposalValidity={new Date(props.proposalValidity)}
      />
    );
  } catch (error) {
    console.error("Failed to parse proposal data", error);
    return <div>Error: Invalid data format.</div>
  }
}
