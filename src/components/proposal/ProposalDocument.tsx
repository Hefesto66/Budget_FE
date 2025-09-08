
import type { SolarCalculationInput, SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { Leaf, Car, Globe, FileSignature, Wrench, Zap, CheckCircle, Package, Settings, PenLine, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface ProposalDocumentProps {
  results: SolarCalculationResult;
  formData: SolarCalculationInput;
  companyData: CompanyFormData;
  clientData: ClientFormData | null;
  customization: CustomizationSettings;
  proposalId: string;
  proposalDate: Date;
  proposalValidity: Date;
}

export function ProposalDocument({ 
    results, 
    formData, 
    companyData, 
    clientData, 
    customization,
    proposalId,
    proposalDate,
    proposalValidity
}: ProposalDocumentProps) {
  
  const custoModulos = (formData.quantidade_modulos ?? 0) * (formData.preco_modulo_reais ?? 0);
  const custoInversor = (formData.custo_inversor_reais ?? 0);
  const custoInstalacao = (formData.custo_fixo_instalacao_reais ?? 0);

  const { colors, content } = customization;

  // Environmental Impact Calculation (example values)
  const co2AvoidedKg = results.geracao.media_mensal_kwh * 12 * 0.475; // 0.475 kg CO2 per kWh
  const treesSaved = Math.round(co2AvoidedKg / 21.77); // 21.77 kg CO2 absorbed by a tree per year

  const Section = ({ children, className, pageBreakBefore = false }: { children: React.ReactNode, className?: string, pageBreakBefore?: boolean }) => (
    <div className={cn("pdf-section", className, pageBreakBefore && "pdf-page-break-before")} style={{ marginBottom: '32px' }}>
      {children}
    </div>
  );
  
  return (
    <div id="proposal-content" className="proposal-document bg-white text-black font-sans" style={{ fontFamily: '"Inter", sans-serif', fontSize: '10pt', padding: '40px', width: '800px' }}>
      {/* Header */}
      <Section>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '2px solid #EEE' }}>
            <div style={{ width: '33.33%' }}>
            {companyData.logo && (
                <img src={companyData.logo} alt="Company Logo" style={{ maxWidth: '140px', maxHeight: '70px', objectFit: 'contain' }} />
            )}
            </div>
            <div style={{ width: '66.66%', textAlign: 'right', fontSize: '9pt', lineHeight: '1.4' }}>
            <h1 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, fontFamily: '"Poppins", sans-serif', margin: 0 }}>{companyData.name}</h1>
            <p style={{ margin: 0 }}>{companyData.address}</p>
            <p style={{ margin: 0 }}>CNPJ: {companyData.cnpj}</p>
            <p style={{ margin: 0 }}>Email: {companyData.email}</p>
            <p style={{ margin: 0 }}>Telefone: {companyData.phone}</p>
            </div>
        </header>
      </Section>

      <main style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        {/* Proposal Title */}
        <Section>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20pt', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, fontFamily: '"Poppins", sans-serif', margin: 0, marginBottom: '24px' }}>Proposta de Sistema Fotovoltaico</h2>
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
        </Section>

        {/* Client Info Placeholder */}
        {clientData && (
          <Section>
            <div style={{ border: '1px solid #EEE', padding: '16px', borderRadius: '8px' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: colors.primary, fontFamily: '"Poppins", sans-serif' }}>Preparado para:</h3>
              <p style={{ fontWeight: '600', margin: 0 }}>{clientData.name}</p>
              <p style={{ margin: 0 }}>{clientData.address}</p>
              <p style={{ margin: 0 }}>CPF/CNPJ: {clientData.document}</p>
            </div>
          </Section>
        )}

        {/* System Description */}
        {content.showInvestmentTable && (
            <Section>
                <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '8px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: colors.primary, fontFamily: '"Poppins", sans-serif' }}>Descrição do Sistema e Investimento</h3>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ borderBottom: '1px solid #CCC' }}>
                        <th style={{ padding: '8px 0', fontWeight: '600' }}>Descrição</th>
                        <th style={{ padding: '8px 0', fontWeight: '600', textAlign: 'center' }}>Qtde.</th>
                        <th style={{ padding: '8px 0', fontWeight: '600', textAlign: 'right' }}>Preço Unit.</th>
                        <th style={{ padding: '8px 0', fontWeight: '600', textAlign: 'right' }}>Preço Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr style={{ borderBottom: '1px solid #EEE' }}>
                        <td style={{ padding: '8px 0' }}>
                            <p style={{ fontWeight: '600', margin: 0 }}>Módulo Fotovoltaico {formData.fabricante_modulo}</p>
                            <p style={{ fontSize: '9pt', color: '#666', margin: 0 }}>Potência: {formData.potencia_modulo_wp}Wp | Garantia: {formData.garantia_defeito_modulo_anos} anos (produto), {formData.garantia_geracao_modulo_anos} anos (geração)</p>
                        </td>
                        <td style={{ padding: '8px 0', textAlign: 'center' }}>{results.dimensionamento.quantidade_modulos}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrency(formData.preco_modulo_reais ?? 0)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrency(custoModulos)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #EEE' }}>
                        <td style={{ padding: '8px 0' }}>
                            <p style={{ fontWeight: '600', margin: 0 }}>Inversor {formData.fabricante_inversor} {formData.modelo_inversor}</p>
                            <p style={{ fontSize: '9pt', color: '#666', margin: 0 }}>Potência: {formData.potencia_inversor_kw}kW | Tensão: {formData.tensao_inversor_v}V | Garantia: {formData.garantia_inversor_anos} anos</p>
                        </td>
                        <td style={{ padding: '8px 0', textAlign: 'center' }}>{formData.quantidade_inversores}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrency(custoInversor)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrency(custoInversor * (formData.quantidade_inversores ?? 1))}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #EEE' }}>
                        <td style={{ padding: '8px 0' }}>
                            <p style={{ fontWeight: '600', margin: 0 }}>Projeto, Instalação e Homologação</p>
                            <p style={{ fontSize: '9pt', color: '#666', margin: 0 }}>Inclui mão de obra, estruturas, cabos, proteções e documentação.</p>
                        </td>
                        <td style={{ padding: '8px 0', textAlign: 'center' }}>1</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrency(custoInstalacao)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrency(custoInstalacao)}</td>
                    </tr>
                    </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <div style={{ minWidth: '250px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14pt', padding: '12px', borderRadius: '4px', backgroundColor: colors.primary, color: colors.textOnPrimary }}>
                            <span>Total:</span>
                            <span>{formatCurrency(results.financeiro.custo_sistema_reais)}</span>
                        </div>
                    </div>
                </div>
            </Section>
        )}
        
         {/* Financial Summary & Performance */}
        <Section>
             <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '16px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: colors.primary, fontFamily: '"Poppins", sans-serif' }}>Análise Financeira e de Geração</h3>
            <div style={{ display: 'flex', gap: '32px' }}>
                 {content.showFinancialSummary && (
                    <div style={{ flex: '1' }}>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontFamily: '"Poppins", sans-serif' }}>Resumo Financeiro</h4>
                        <div style={{ fontSize: '10pt', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <InfoRow label="Conta de Luz Média Atual" value={formatCurrency(results.conta_media_mensal_reais.antes)} />
                            <InfoRow label="Conta de Luz Média Estimada" value={formatCurrency(results.conta_media_mensal_reais.depois)} highlightColor={colors.primary} />
                            <InfoRow label="Economia Mensal Estimada" value={formatCurrency(results.financeiro.economia_mensal_reais)} />
                            <InfoRow label="Economia no 1º Ano" value={formatCurrency(results.financeiro.economia_primeiro_ano)} />
                            <InfoRow label="Tempo de Retorno (Payback)" value={`${formatNumber(results.financeiro.payback_simples_anos, 1)} anos`} highlightColor={colors.primary} />
                        </div>
                    </div>
                 )}
                 {content.showSystemPerformance && (
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
        </Section>
      </main>
    </div>
  );
}

const InfoRow = ({ label, value, highlightColor }: { label: string; value: string; highlightColor?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F5F5F5', fontWeight: highlightColor ? 'bold' : 'normal' }}>
        <span>{label}</span>
        <span style={{ color: highlightColor || 'inherit' }}>{value}</span>
    </div>
)
