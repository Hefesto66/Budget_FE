
import Image from 'next/image';
import type { SolarCalculationInput, SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Leaf, Car, Globe, FileSignature, Wrench, Zap as ZapIcon, CheckCircle } from 'lucide-react';
import { SavingsChart } from '../SavingsChart';
import { format } from 'date-fns';
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

  const formatAddress = (address: string) => {
    // This function will only be used on the server, so we can't use JSX directly.
    // We'll return a string and handle line breaks with CSS.
    return address.replace(/\n/g, '<br />');
  };
  
  const custoModulos = results.dimensionamento.quantidade_modulos * formData.preco_modulo_reais;
  const custoInversor = formData.custo_inversor_reais;
  const custoInstalacao = formData.custo_fixo_instalacao_reais;

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
    <div id="proposal-content" className="bg-white text-black font-sans" style={{ fontFamily: '"PT Sans", sans-serif', fontSize: '10pt', width: '210mm', height: '297mm', padding: '1in' }}>
      {/* Header */}
      <Section>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '2px solid #EEE' }}>
            <div style={{ width: '33.33%' }}>
            {companyData.logo && (
                <img src={companyData.logo} alt="Company Logo" style={{ maxWidth: '140px', maxHeight: '70px', objectFit: 'contain' }} />
            )}
            </div>
            <div style={{ width: '66.66%', textAlign: 'right', fontSize: '9pt' }}>
            <h1 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, fontFamily: '"Playfair Display", serif', margin: 0 }}>{companyData.name}</h1>
            <p style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: formatAddress(companyData.address) }}></p>
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
                <h2 style={{ fontSize: '20pt', fontWeight: 'bold', textTransform: 'uppercase', color: colors.primary, fontFamily: '"Playfair Display", serif', margin: 0 }}>Proposta de Sistema Fotovoltaico</h2>
                <p style={{ color: '#666', margin: 0 }}>Documento gerado em: {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>
        </Section>

        {/* Client Info Placeholder */}
        {clientData && (
          <Section>
            <div style={{ border: '1px solid #EEE', padding: '16px', borderRadius: '8px' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: colors.primary, fontFamily: '"Playfair Display", serif' }}>Preparado para:</h3>
              <p style={{ fontWeight: '600', margin: 0 }}>{clientData.name}</p>
              <p style={{ margin: 0 }}>{clientData.address}</p>
              <p style={{ margin: 0 }}>CPF/CNPJ: {clientData.document}</p>
            </div>
          </Section>
        )}

        {/* Proposal Summary */}
        <Section>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px', textAlign: 'center' }}>
                <div style={{ backgroundColor: '#F9F9F9', padding: '12px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '9pt', color: '#555', margin: 0 }}>ID da Proposta</p>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>{proposalId}</p>
                </div>
                <div style={{ backgroundColor: '#F9F9F9', padding: '12px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '9pt', color: '#555', margin: 0 }}>Data da Proposta</p>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>{format(proposalDate, 'dd/MM/yyyy')}</p>
                </div>
                <div style={{ backgroundColor: '#F9F9F9', padding: '12px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '9pt', color: '#555', margin: 0 }}>Validade</p>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>{format(proposalValidity, 'dd/MM/yyyy')}</p>
                </div>
            </div>
        </Section>

        {/* System Description */}
        {content.showInvestmentTable && (
            <Section>
                <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '8px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: colors.primary, fontFamily: '"Playfair Display", serif' }}>Descrição do Sistema e Investimento</h3>
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
                        <td style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {content.showEquipmentDetails && <img src="https://picsum.photos/100/100" alt="Painel Solar" style={{ width: '50px', height: '50px', borderRadius: '4px' }} data-ai-hint="solar panel"/>}
                            <div>
                                <p style={{ fontWeight: '600', margin: 0 }}>Módulo Fotovoltaico {formData.fabricante_modulo}</p>
                                <p style={{ fontSize: '9pt', color: '#666', margin: 0 }}>Potência: {formData.potencia_modulo_wp}Wp | Garantia: {formData.garantia_defeito_modulo_anos} anos (produto), {formData.garantia_geracao_modulo_anos} anos (geração)</p>
                            </div>
                        </td>
                        <td style={{ padding: '8px 0', textAlign: 'center' }}>{results.dimensionamento.quantidade_modulos}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrency(formData.preco_modulo_reais)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrency(custoModulos)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #EEE' }}>
                        <td style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {content.showEquipmentDetails && <img src="https://picsum.photos/100/100" alt="Inversor" style={{ width: '50px', height: '50px', borderRadius: '4px' }} data-ai-hint="inverter"/>}
                            <div>
                                <p style={{ fontWeight: '600', margin: 0 }}>Inversor {formData.fabricante_inversor} {formData.modelo_inversor}</p>
                                <p style={{ fontSize: '9pt', color: '#666', margin: 0 }}>Potência: {formData.potencia_inversor_kw}kW | Tensão: {formData.tensao_inversor_v}V | Garantia: {formData.garantia_inversor_anos} anos</p>
                            </div>
                        </td>
                        <td style={{ padding: '8px 0', textAlign: 'center' }}>{formData.quantidade_inversores}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrency(custoInversor)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrency(custoInversor * formData.quantidade_inversores)}</td>
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
                    <div style={{ width: '33.33%' }}>
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
             <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '8px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: colors.primary, fontFamily: '"Playfair Display", serif' }}>Análise Financeira e de Geração</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
                 {content.showFinancialSummary && (
                    <div>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Resumo Financeiro</h4>
                        <div style={{ fontSize: '10pt', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <InfoRow label="Conta de Luz Média Atual" value={formatCurrency(results.conta_media_mensal_reais.antes)} />
                            <InfoRow label="Conta de Luz Média Estimada" value={formatCurrency(results.conta_media_mensal_reais.depois)} highlightColor={colors.primary} />
                            <InfoRow label="Economia Mensal Estimada" value={formatCurrency(results.economia_mensal_reais)} />
                            <InfoRow label="Economia no 1º Ano" value={formatCurrency(results.economia_primeiro_ano)} />
                            <InfoRow label="Tempo de Retorno (Payback)" value={`${formatNumber(results.payback_simples_anos, 1)} anos`} highlightColor={colors.primary} />
                        </div>
                    </div>
                 )}
                 {content.showSystemPerformance && (
                    <div>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Desempenho do Sistema</h4>
                         <div style={{ fontSize: '10pt', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <InfoRow label="Potência do Sistema" value={`${formatNumber(results.dimensionamento.potencia_sistema_kwp, 2)} kWp`} />
                            <InfoRow label="Geração Média Mensal" value={`${formatNumber(results.geracao.media_mensal_kwh, 0)} kWh`} />
                            <InfoRow label="Consumo Mensal do Cliente" value={`${formatNumber(formData.consumo_mensal_kwh, 0)} kWh`} />
                        </div>
                    </div>
                 )}
            </div>
        </Section>

        {/* Environmental Impact */}
        {content.showEnvironmentalImpact && (
            <Section>
                <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '16px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: colors.primary, fontFamily: '"Playfair Display", serif' }}>Seu Impacto Positivo no Planeta</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
                    <ImpactCard iconSVG='<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"/>' value={formatNumber(treesSaved, 0)} label="Árvores Salvas por Ano"/>
                    <ImpactCard iconSVG='<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v3c0 .6.4 1 1 1h3v3c0 .6.4 1 1 1h1"/>' value={`${formatNumber(co2AvoidedKg, 0)} kg`} label="de CO₂ Evitados por Ano"/>
                    <ImpactCard iconSVG='<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20z"/>' value="100%" label="Energia Limpa e Renovável"/>
                </div>
            </Section>
        )}

        {/* Generation and Savings Charts */}
        {content.showGenerationChart && (
            <Section pageBreakBefore={true}>
                <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '16px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: colors.primary, fontFamily: '"Playfair Display", serif' }}>Estimativa de Geração Mensal</h3>
                <p style={{ fontSize: '9pt', color: '#666', marginBottom: '16px' }}>Este gráfico mostra a variação da geração de energia do seu sistema ao longo do ano, com base na irradiação solar local.</p>
                {/* Placeholder for monthly generation chart */}
                <div style={{ width: '100%', height: '250px', backgroundColor: '#F9F9F9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <p style={{ color: '#AAA' }}>Gráfico de Geração Anual (Placeholder)</p>
                </div>
            </Section>
        )}

        {content.showSavingsChart && (
             <Section pageBreakBefore={true}>
                <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '16px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: colors.primary, fontFamily: '"Playfair Display", serif' }}>Projeção de Economia em 25 Anos</h3>
                 <p style={{ fontSize: '9pt', color: '#666', marginBottom: '16px' }}>Veja como sua economia acumulada cresce ao longo da vida útil do sistema solar, superando o investimento inicial.</p>
                <div style={{ width: '100%', height: '22rem', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid #EEE' }}>
                   {/* This is a server component, so we can't render the interactive chart directly. */}
                   <p style={{ color: '#AAA' }}>Gráfico de Economia Acumulada</p>
                </div>
            </Section>
        )}

        {/* Timeline */}
        {content.showTimeline && (
            <Section>
                <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '16px', borderBottom: '1px solid #EEE', paddingBottom: '4px', color: colors.primary, fontFamily: '"Playfair Display", serif' }}>Nossas Próximas Etapas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <TimelineStep iconSVG='<path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.71.71a5.4 5.4 0 0 0 0 7.65l.71.71a5.4 5.4 0 0 0 7.65 0l4.24-4.24a5.4 5.4 0 0 0 0-7.65l-4.24-4.24Z"/><path d="m14.5 18.5-4-4"/>' title="Assinatura do Contrato" description="Formalização da nossa parceria para um futuro mais sustentável." />
                    <TimelineStep iconSVG='<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 S 5.27 10 5.27 10h1.46a2 2 0 0 1 1.73 1l.25.43a2 2 0 0 1 0 2l-.25.43a2 2 0 0 1-1.73 1H5.27s-.86.66-1.02.73l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-2-2l-.25-.43a2 2 0 0 1 0-2l.25-.43a2 2 0 0 1 1.73-1h1.46a2 2 0 0 1 1.73-1l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>' title="Elaboração do Projeto e Homologação" description="Nossa engenharia cuida de toda a burocracia com a concessionária (Prazo: 15-30 dias)." />
                    <TimelineStep iconSVG='<path d="m13.2 2.9-3.2 3.2 3.2 3.2"/>' title="Instalação do Sistema" description="Nossa equipe especializada realiza a instalação completa (Prazo: 2-4 dias)." />
                    <TimelineStep iconSVG='<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>' title="Ativação pela Concessionária" description="Após a vistoria, a concessionária ativa seu sistema e você começa a economizar." />
                </div>
            </Section>
        )}

         {/* Footer */}
        {content.showTerms && (
            <Section pageBreakBefore={true}>
                <footer style={{ paddingTop: '16px', fontSize: '9pt', color: '#666', textAlign: 'center', borderTop: '2px solid #EEE', position: 'absolute', bottom: '1in', left: '1in', right: '1in' }}>
                    <p style={{ margin: 0 }}>Esta é uma proposta comercial. Os valores e estimativas de geração são baseados nos dados fornecidos e podem variar.</p>
                    <p style={{ margin: 0 }}>Condições de pagamento a combinar. | {companyData.name} - Todos os direitos reservados &copy; {new Date().getFullYear()}</p>
                </footer>
            </Section>
        )}
      </main>
    </div>
  );
}

const InfoRow = ({ label, value, highlightColor }: { label: string; value: string; highlightColor?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F5F5F5', fontWeight: highlightColor ? 'bold' : 'normal' }}>
        <span>{label}:</span>
        <span style={{ color: highlightColor }}>{value}</span>
    </div>
)

const ImpactCard = ({ iconSVG, value, label }: { iconSVG: string, value: string, label: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', backgroundColor: '#FAFAFA', borderRadius: '8px' }}>
        <div style={{ color: '#10B981', marginBottom: '8px' }}>
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: iconSVG }} />
        </div>
        <p style={{ fontWeight: 'bold', fontSize: '16pt', color: '#333', margin: 0 }}>{value}</p>
        <p style={{ fontSize: '9pt', color: '#666', margin: 0 }}>{label}</p>
    </div>
)

const TimelineStep = ({ iconSVG, title, description }: { iconSVG: string, title: string, description: string}) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ flexShrink: 0, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#F9F9F9', color: '#555' }}>
            <svg xmlns="http://www.w-3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: iconSVG }} />
        </div>
        <div>
            <h5 style={{ fontWeight: '600', color: '#333', margin: 0 }}>{title}</h5>
            <p style={{ fontSize: '9pt', color: '#666', margin: 0 }}>{description}</p>
        </div>
    </div>
)
