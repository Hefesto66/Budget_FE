
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import React from 'react';
import { SavingsChart } from '../SavingsChart';
import type { WizardFormData } from '../wizard/Wizard';

interface ProposalDocumentProps {
  results: SolarCalculationResult;
  formData: WizardFormData['calculationInput'];
  billOfMaterials: WizardFormData['billOfMaterials'];
  companyData: CompanyFormData;
  clientData: ClientFormData;
  customization: CustomizationSettings;
  proposalId: string;
  proposalDate: Date;
  proposalValidity: Date;
}

const Block = ({ children, className = '', pageBreakBefore = false }: { children: React.ReactNode, className?: string, pageBreakBefore?: boolean }) => (
    <div className={cn("pdf-block", className, pageBreakBefore && "pdf-page-break-before")}>
      {children}
    </div>
);

const HeaderBlock = ({ companyData, proposalId, proposalDate, proposalValidity, clientData, customization }: Pick<ProposalDocumentProps, 'companyData' | 'proposalId' | 'proposalDate' | 'proposalValidity' | 'clientData' | 'customization'>) => (
  <Block>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '2px solid #EEE' }}>
        <div style={{ width: '33.33%' }}>
        {companyData.logo && (
            <img src={companyData.logo} alt="Company Logo" style={{ maxWidth: '140px', maxHeight: '70px', objectFit: 'contain' }} />
        )}
        </div>
        <div style={{ width: '66.66%', textAlign: 'right', fontSize: '9pt', lineHeight: '1.4' }}>
        <h1 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', color: customization.colors.primary, fontFamily: '"Poppins", sans-serif', margin: 0 }}>{companyData.name}</h1>
        <p style={{ margin: 0 }}>{companyData.address}</p>
        <p style={{ margin: 0 }}>CNPJ: {companyData.cnpj}</p>
        <p style={{ margin: 0 }}>Email: {companyData.email}</p>
        <p style={{ margin: 0 }}>Telefone: {companyData.phone}</p>
        </div>
    </header>
    <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <h2 style={{ fontSize: '20pt', fontWeight: 'bold', textTransform: 'uppercase', color: customization.colors.primary, fontFamily: '"Poppins", sans-serif', margin: 0, marginBottom: '24px' }}>Proposta de Sistema Fotovoltaico</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', textAlign: 'center' }}>
            <div style={{ flex: 1, backgroundColor: '#F9F9F9', padding: '12px', borderRadius: '4px', border: '1px solid #EEE' }}>
                <p style={{ fontSize: '9pt', color: '#555', margin: 0, marginBottom: '4px' }}>ID da Proposta</p>
                <p style={{ fontWeight: 'bold', margin: 0 }}>{proposalId}</p>
            </div>
            <div style={{ flex: 1, backgroundColor: '#F9F9F9', padding: '12px', borderRadius: '4px', border: '1px solid #EEE' }}>
                <p style={{ fontSize: '9pt', color: '#555', margin: 0, marginBottom: '4px' }}>Data da Proposta</p>
                <p style={{ fontWeight: 'bold', margin: 0 }}>{formatDate(proposalDate)}</p>
            </div>
            <div style={{ flex: 1, backgroundColor: '#F9F9F9', padding: '12px', borderRadius: '4px', border: '1px solid #EEE' }}>
                <p style={{ fontSize: '9pt', color: '#555', margin: 0, marginBottom: '4px' }}>Validade</p>
                <p style={{ fontWeight: 'bold', margin: 0 }}>{formatDate(proposalValidity)}</p>
            </div>
        </div>
    </div>
    <div style={{ border: '1px solid #EEE', padding: '16px', borderRadius: '8px' }}>
      <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: customization.colors.primary, fontFamily: '"Poppins", sans-serif' }}>Preparado para:</h3>
      <p style={{ fontWeight: '600', margin: 0 }}>{clientData.name}</p>
      {clientData.address && <p style={{ margin: 0 }}>{clientData.address}</p>}
      {clientData.document && <p style={{ margin: 0 }}>CPF/CNPJ: {clientData.document}</p>}
    </div>
  </Block>
);

const InvestmentTableBlock = ({ billOfMaterials, results, customization }: Pick<ProposalDocumentProps, 'billOfMaterials' | 'results' | 'customization'>) => {
    const showPrices = customization.content.showPriceColumns;
    return (
        <Block>
            <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '8px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: customization.colors.primary, fontFamily: '"Poppins", sans-serif' }}>Descrição do Sistema e Investimento</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead>
                <tr style={{ borderBottom: '1px solid #CCC' }}>
                    <th style={{ padding: '8px 4px', fontWeight: '600' }}>Descrição</th>
                    <th style={{ padding: '8px 4px', fontWeight: '600', textAlign: 'center' }}>Qtde.</th>
                    {showPrices && <th style={{ padding: '8px 4px', fontWeight: '600', textAlign: 'right' }}>Preço Unit.</th>}
                    {showPrices && <th style={{ padding: '8px 4px', fontWeight: '600', textAlign: 'right' }}>Preço Total</th>}
                </tr>
                </thead>
                <tbody>
                {billOfMaterials.map((item) => (
                    <tr key={item.productId} style={{ borderBottom: '1px solid #EEE' }}>
                        <td style={{ padding: '8px 4px' }}>
                            <p style={{ fontWeight: '600', margin: 0 }}>{item.name}</p>
                            <p style={{ fontSize: '9pt', color: '#666', margin: 0 }}>
                                Fabricante: {item.manufacturer}
                                {item.technicalSpecifications?.['Potência (Wp)'] && ` | Potência: ${item.technicalSpecifications['Potência (Wp)']}Wp`}
                                {item.technicalSpecifications?.['Eficiência (%)'] && ` | Eficiência: ${item.technicalSpecifications['Eficiência (%)']}%`}
                            </p>
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>{item.quantity}</td>
                        {showPrices && <td style={{ padding: '8px 4px', textAlign: 'right' }}>{formatCurrency(item.cost)}</td>}
                        {showPrices && <td style={{ padding: '8px 4px', textAlign: 'right' }}>{formatCurrency(item.cost * item.quantity)}</td>}
                    </tr>
                ))}
                </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <div style={{ minWidth: '250px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14pt', padding: '12px', borderRadius: '4px', backgroundColor: customization.colors.primary, color: customization.colors.textOnPrimary }}>
                        <span>Total:</span>
                        <span>{formatCurrency(results.financeiro.custo_sistema_reais)}</span>
                    </div>
                </div>
            </div>
        </Block>
    );
};

const InfoRow = ({ label, value, highlightColor }: { label: string; value: string; highlightColor?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F5F5F5', fontWeight: highlightColor ? 'bold' : 'normal' }}>
        <span>{label}</span>
        <span style={{ color: highlightColor || 'inherit' }}>{value}</span>
    </div>
);

const SummaryBlock = ({ results, formData, customization }: Pick<ProposalDocumentProps, 'results' | 'formData' | 'customization'>) => (
    <Block className='my-8'>
        <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '16px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: customization.colors.primary, fontFamily: '"Poppins", sans-serif' }}>Análise Financeira e de Geração</h3>
        <div style={{ display: 'flex', gap: '32px' }}>
            {customization.content.showFinancialSummary && (
            <div style={{ flex: '1' }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontFamily: '"Poppins", sans-serif' }}>Resumo Financeiro</h4>
                <div style={{ fontSize: '10pt', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <InfoRow label="Conta de Luz Média Atual" value={formatCurrency(results.conta_media_mensal_reais.antes)} />
                    <InfoRow label="Conta de Luz Média Estimada" value={formatCurrency(results.conta_media_mensal_reais.depois)} highlightColor={customization.colors.primary} />
                    <InfoRow label="Economia Mensal Estimada" value={formatCurrency(results.financeiro.economia_mensal_reais)} />
                    <InfoRow label="Economia no 1º Ano" value={formatCurrency(results.financeiro.economia_primeiro_ano)} />
                    <InfoRow label="Tempo de Retorno (Payback)" value={`${formatNumber(results.financeiro.payback_simples_anos, 1)} anos`} highlightColor={customization.colors.primary} />
                </div>
            </div>
            )}
            {customization.content.showSystemPerformance && (
            <div style={{ flex: '1' }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontFamily: '"Poppins", sans-serif' }}>Desempenho do Sistema</h4>
                <div style={{ fontSize: '10pt', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <InfoRow label="Potência do Sistema" value={`${formatNumber(results.dimensionamento.potencia_sistema_kwp, 2)} kWp`} />
                    <InfoRow label="Geração Média Mensal" value={`${formatNumber(results.geracao.media_mensal_kwh, 0)} kWh`} />
                    <InfoRow label="Consumo Mensal do Cliente" value={`${formatNumber(formData.consumo_mensal_kwh, 0)} kWh`} />
                </div>
            </div>
            )}
        </div>
    </Block>
);

const AdvancedAnalysisBlock = ({ results, customization }: Pick<ProposalDocumentProps, 'results' | 'customization'>) => (
    <Block className='my-8' pageBreakBefore>
        <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '16px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: customization.colors.primary, fontFamily: '"Poppins", sans-serif' }}>Análise de Investimento Avançada</h3>
        <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontFamily: '"Poppins", sans-serif' }}>VPL (Valor Presente Líquido)</h4>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: customization.colors.primary }}>{formatCurrency(results.financeiro.vpl_reais)}</p>
                <p style={{ fontSize: '9pt', color: '#666' }}>O VPL representa o lucro total do projeto, trazido a valor presente. Um VPL positivo indica que o investimento é financeiramente viável e supera a taxa de atratividade definida.</p>
            </div>
            <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontFamily: '"Poppins", sans-serif' }}>TIR (Taxa Interna de Retorno)</h4>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: customization.colors.primary }}>{isFinite(results.financeiro.tir_percentual) && results.financeiro.tir_percentual !== Infinity ? `${formatNumber(results.financeiro.tir_percentual, 2)}%` : 'N/A'}</p>
                <p style={{ fontSize: '9pt', color: '#666' }}>A TIR é a taxa de rentabilidade anual do seu investimento. Quanto maior a TIR, mais atrativo é o projeto em comparação com outras opções de investimento.</p>
            </div>
        </div>
    </Block>
);

const SavingsChartBlock = ({ results, customization }: Pick<ProposalDocumentProps, 'results' | 'customization'>) => (
    <Block className='my-8' pageBreakBefore>
        <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '16px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: customization.colors.primary, fontFamily: '"Poppins", sans-serif' }}>Projeção de Economia Acumulada</h3>
        <div style={{ height: '300px' }}>
             <SavingsChart annualSavings={results.financeiro.economia_anual_reais} />
        </div>
    </Block>
);


const CashflowTableBlock = ({ results, customization }: Pick<ProposalDocumentProps, 'results' | 'customization'>) => (
    <Block className='my-8' pageBreakBefore>
        <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '16px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: customization.colors.primary, fontFamily: '"Poppins", sans-serif' }}>Projeção de Fluxo de Caixa (25 Anos)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
            <thead>
                <tr style={{ borderBottom: '1px solid #CCC', backgroundColor: '#F9F9F9' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Ano</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Economia Anual (R$)</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Fluxo de Caixa (R$)</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Fluxo de Caixa Acumulado (R$)</th>
                </tr>
            </thead>
            <tbody>
                {results.financeiro.cash_flow_reais.map((flow, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #EEE' }}>
                        <td style={{ padding: '6px 8px', textAlign: 'left' }}>{index === 0 ? 'Investimento' : `Ano ${index}`}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{index > 0 ? formatCurrency(flow) : '-'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: flow < 0 ? '#D9534F' : '#5CB85C' }}>{formatCurrency(flow)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(results.financeiro.cash_flow_reais.slice(0, index + 1).reduce((a, b) => a + b, 0))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </Block>
);


const FooterBlock = ({ customization }: Pick<ProposalDocumentProps, 'customization'>) => (
  <Block>
    <footer style={{ borderTop: '2px solid #EEE', paddingTop: '24px', marginTop: '48px', fontSize: '9pt', color: '#555', textAlign: 'center' }}>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{customization.footer.customText}</p>
    </footer>
  </Block>
);


export function ProposalDocument({ 
    results, 
    formData,
    billOfMaterials,
    companyData, 
    clientData, 
    customization,
    proposalId,
    proposalDate,
    proposalValidity
}: ProposalDocumentProps) {
  
  return (
    <div id="proposal-content" className="proposal-document bg-white text-black font-sans" style={{ fontFamily: '"Inter", sans-serif', fontSize: '10pt', padding: '40px', width: '210mm', margin: 'auto' }}>
      <HeaderBlock 
        companyData={companyData} 
        proposalId={proposalId} 
        proposalDate={proposalDate} 
        proposalValidity={proposalValidity} 
        clientData={clientData} 
        customization={customization}
      />

      <main style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        {customization.content.showInvestmentTable && <InvestmentTableBlock billOfMaterials={billOfMaterials} results={results} customization={customization} />}
        
        <SummaryBlock results={results} formData={formData} customization={customization} />

        {customization.content.showAdvancedAnalysis && <AdvancedAnalysisBlock results={results} customization={customization} />}
        
        {customization.content.showSavingsChart && <SavingsChartBlock results={results} customization={customization} />}

        {customization.content.showCashflowTable && <CashflowTableBlock results={results} customization={customization} />}
        
      </main>

      <FooterBlock customization={customization} />
    </div>
  );
}
