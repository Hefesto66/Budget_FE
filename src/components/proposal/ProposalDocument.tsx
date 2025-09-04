
import Image from 'next/image';
import type { SolarCalculationInput, SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Leaf, Car, Globe, FileSignature, Wrench, Zap as ZapIcon, CheckCircle } from 'lucide-react';
import { SavingsChart } from '../SavingsChart';

interface ProposalDocumentProps {
  results: SolarCalculationResult;
  formData: SolarCalculationInput;
  companyData: CompanyFormData;
  clientData: ClientFormData | null;
  customization: CustomizationSettings;
}

export function ProposalDocument({ results, formData, companyData, clientData, customization }: ProposalDocumentProps) {
  const today = new Date();
  const validityDate = new Date();
  validityDate.setDate(today.getDate() + 15); // Proposal valid for 15 days

  const formatAddress = (address: string) => {
    return address.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };
  
  const custoModulos = results.dimensionamento.quantidade_modulos * formData.preco_modulo_reais;
  const custoInversor = formData.custo_inversor_reais;
  const custoInstalacao = formData.custo_fixo_instalacao_reais;

  const { colors, content } = customization;

  // Environmental Impact Calculation (example values)
  const co2AvoidedKg = results.geracao.media_mensal_kwh * 12 * 0.475; // 0.475 kg CO2 per kWh
  const treesSaved = Math.round(co2AvoidedKg / 21.77); // 21.77 kg CO2 absorbed by a tree per year

  return (
    <div className="bg-white text-black font-sans text-sm p-10" style={{ width: '8.5in', minHeight: '11in' }}>
      {/* Header */}
      <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
        <div className="w-1/3">
          {companyData.logo && (
            <Image src={companyData.logo} alt="Company Logo" width={140} height={70} className="object-contain" />
          )}
        </div>
        <div className="w-2/3 text-right text-xs">
          <h1 className="text-lg font-bold uppercase" style={{ color: colors.primary }}>{companyData.name}</h1>
          <p>{formatAddress(companyData.address)}</p>
          <p>CNPJ: {companyData.cnpj}</p>
          <p>Email: {companyData.email}</p>
          <p>Telefone: {companyData.phone}</p>
        </div>
      </header>

      <main className="py-8">
        {/* Proposal Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold uppercase" style={{ color: colors.primary }}>Proposta de Sistema Fotovoltaico</h2>
          <p className="text-gray-500">Documento gerado em: {today.toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Client Info Placeholder */}
        {clientData && (
          <section className="mb-8">
            <div className="border border-gray-200 p-4 rounded-lg">
              <h3 className="font-bold mb-2" style={{ color: colors.primary }}>Preparado para:</h3>
              <p className="font-semibold">{clientData.name}</p>
              <p>{clientData.address}</p>
              <p>CPF/CNPJ: {clientData.document}</p>
            </div>
          </section>
        )}

        {/* Proposal Summary */}
        <section className="grid grid-cols-3 gap-4 mb-8 text-center">
            <div className="bg-gray-100 p-3 rounded">
                <p className="text-xs text-gray-600">ID da Proposta</p>
                <p className="font-bold">FE-S001</p>
            </div>
             <div className="bg-gray-100 p-3 rounded">
                <p className="text-xs text-gray-600">Data da Proposta</p>
                <p className="font-bold">{today.toLocaleDateString('pt-BR')}</p>
            </div>
             <div className="bg-gray-100 p-3 rounded">
                <p className="text-xs text-gray-600">Validade</p>
                <p className="font-bold">{validityDate.toLocaleDateString('pt-BR')}</p>
            </div>
        </section>

        {/* System Description */}
        {content.showInvestmentTable && (
            <section className="mb-8">
            <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1" style={{ color: colors.primary }}>Descrição do Sistema e Investimento</h3>
            <table className="w-full text-left">
                <thead>
                <tr className="border-b border-gray-300">
                    <th className="py-2 font-semibold">Descrição</th>
                    <th className="py-2 font-semibold text-center">Qtde.</th>
                    <th className="py-2 font-semibold text-right">Preço Unit.</th>
                    <th className="py-2 font-semibold text-right">Preço Total</th>
                </tr>
                </thead>
                <tbody>
                <tr className="border-b border-gray-200">
                    <td className="py-2">
                        <div className="flex items-center gap-4">
                            {content.showEquipmentDetails && <Image src="https://picsum.photos/100/100" alt="Painel Solar" width={50} height={50} className="rounded" data-ai-hint="solar panel"/>}
                            <div>
                                <p className="font-semibold">Módulo Fotovoltaico {formData.fabricante_modulo}</p>
                                <p className="text-xs text-gray-500">Potência: {formData.potencia_modulo_wp}Wp | Garantia: {formData.garantia_defeito_modulo_anos} anos (produto), {formData.garantia_geracao_modulo_anos} anos (geração)</p>
                            </div>
                        </div>
                    </td>
                    <td className="py-2 text-center">{results.dimensionamento.quantidade_modulos}</td>
                    <td className="py-2 text-right">{formatCurrency(formData.preco_modulo_reais)}</td>
                    <td className="py-2 text-right">{formatCurrency(custoModulos)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                    <td className="py-2">
                       <div className="flex items-center gap-4">
                            {content.showEquipmentDetails && <Image src="https://picsum.photos/100/100" alt="Inversor" width={50} height={50} className="rounded" data-ai-hint="inverter"/>}
                           <div>
                                <p className="font-semibold">Inversor {formData.fabricante_inversor} {formData.modelo_inversor}</p>
                                <p className="text-xs text-gray-500">Potência: {formData.potencia_inversor_kw}kW | Tensão: {formData.tensao_inversor_v}V | Garantia: {formData.garantia_inversor_anos} anos</p>
                           </div>
                       </div>
                    </td>
                    <td className="py-2 text-center">{formData.quantidade_inversores}</td>
                    <td className="py-2 text-right">{formatCurrency(custoInversor)}</td>
                    <td className="py-2 text-right">{formatCurrency(custoInversor * formData.quantidade_inversores)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                    <td className="py-2">
                        <p className="font-semibold">Projeto, Instalação e Homologação</p>
                        <p className="text-xs text-gray-500">Inclui mão de obra, estruturas, cabos, proteções e documentação.</p>
                    </td>
                    <td className="py-2 text-center">1</td>
                    <td className="py-2 text-right">{formatCurrency(custoInstalacao)}</td>
                    <td className="py-2 text-right">{formatCurrency(custoInstalacao)}</td>
                </tr>
                </tbody>
            </table>
            <div className="flex justify-end mt-4">
                <div className="w-1/3">
                    <div className="flex justify-between font-bold text-lg p-3 rounded" style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}>
                        <span>Total:</span>
                        <span>{formatCurrency(results.financeiro.custo_sistema_reais)}</span>
                    </div>
                </div>
            </div>
            </section>
        )}
        

         {/* Financial Summary */}
        <section className="mb-8">
             <h3 className="font-bold text-lg mb-2 border-b border-gray-200 pb-1" style={{ color: colors.primary }}>Análise Financeira e de Geração</h3>
            <div className="grid grid-cols-2 gap-8">
                 {content.showFinancialSummary && (
                    <div>
                        <h4 className="font-bold mb-2">Resumo Financeiro</h4>
                        <div className="space-y-1 text-sm">
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
                        <h4 className="font-bold mb-2">Desempenho do Sistema</h4>
                        <div className="space-y-1 text-sm">
                            <InfoRow label="Potência do Sistema" value={`${formatNumber(results.dimensionamento.potencia_sistema_kwp, 2)} kWp`} />
                            <InfoRow label="Geração Média Mensal" value={`${formatNumber(results.geracao.media_mensal_kwh, 0)} kWh`} />
                            <InfoRow label="Consumo Mensal do Cliente" value={`${formatNumber(formData.consumo_mensal_kwh, 0)} kWh`} />
                        </div>
                    </div>
                 )}
            </div>
        </section>

        {/* Environmental Impact */}
        {content.showEnvironmentalImpact && (
            <section className="mb-8">
                <h3 className="font-bold text-lg mb-4 border-b border-gray-200 pb-1" style={{ color: colors.primary }}>Seu Impacto Positivo no Planeta</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <ImpactCard icon={<Leaf size={32}/>} value={formatNumber(treesSaved, 0)} label="Árvores Salvas por Ano"/>
                    <ImpactCard icon={<Car size={32}/>} value={`${formatNumber(co2AvoidedKg, 0)} kg`} label="de CO₂ Evitados por Ano"/>
                    <ImpactCard icon={<Globe size={32}/>} value="100%" label="Energia Limpa e Renovável"/>
                </div>
            </section>
        )}

        {/* Generation and Savings Charts */}
        {content.showGenerationChart && (
            <section className="mb-8">
                <h3 className="font-bold text-lg mb-4 border-b border-gray-200 pb-1" style={{ color: colors.primary }}>Estimativa de Geração Mensal</h3>
                <p className="text-xs text-gray-500 mb-4">Este gráfico mostra a variação da geração de energia do seu sistema ao longo do ano, com base na irradiação solar local.</p>
                {/* Placeholder for monthly generation chart */}
                <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                    <p className="text-gray-400">Gráfico de Geração Anual (Placeholder)</p>
                </div>
            </section>
        )}

        {content.showSavingsChart && (
             <section className="mb-8">
                <h3 className="font-bold text-lg mb-4 border-b border-gray-200 pb-1" style={{ color: colors.primary }}>Projeção de Economia em 25 Anos</h3>
                 <p className="text-xs text-gray-500 mb-4">Veja como sua economia acumulada cresce ao longo da vida útil do sistema solar, superando o investimento inicial.</p>
                <div className="w-full h-64 bg-white flex items-center justify-center rounded-lg border">
                   <SavingsChart annualSavings={results.economia_anual_reais} />
                </div>
            </section>
        )}

        {/* Timeline */}
        {content.showTimeline && (
            <section className="mb-8">
                <h3 className="font-bold text-lg mb-4 border-b border-gray-200 pb-1" style={{ color: colors.primary }}>Nossas Próximas Etapas</h3>
                <div className="flex flex-col space-y-4">
                    <TimelineStep icon={<FileSignature />} title="Assinatura do Contrato" description="Formalização da nossa parceria para um futuro mais sustentável." />
                    <TimelineStep icon={<Wrench />} title="Elaboração do Projeto e Homologação" description="Nossa engenharia cuida de toda a burocracia com a concessionária (Prazo: 15-30 dias)." />
                    <TimelineStep icon={<ZapIcon />} title="Instalação do Sistema" description="Nossa equipe especializada realiza a instalação completa (Prazo: 2-4 dias)." />
                    <TimelineStep icon={<CheckCircle />} title="Ativação pela Concessionária" description="Após a vistoria, a concessionária ativa seu sistema e você começa a economizar." />
                </div>
            </section>
        )}
      </main>

       {/* Footer */}
       {content.showTerms && (
            <footer className="pt-8 text-xs text-gray-500 text-center border-t-2 border-gray-200 mt-auto">
                <p>Esta é uma proposta comercial. Os valores e estimativas de geração são baseados nos dados fornecidos e podem variar.</p>
                <p>Condições de pagamento a combinar. | {companyData.name} - Todos os direitos reservados &copy; {today.getFullYear()}</p>
            </footer>
       )}
    </div>
  );
}

const InfoRow = ({ label, value, highlightColor }: { label: string; value: string; highlightColor?: string }) => (
    <div className={`flex justify-between py-1.5 border-b border-gray-100 ${highlightColor ? 'font-bold' : ''}`}>
        <span>{label}:</span>
        <span style={{ color: highlightColor }}>{value}</span>
    </div>
)

const ImpactCard = ({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) => (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
        <div className="text-green-600 mb-2">{icon}</div>
        <p className="font-bold text-xl text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
)

const TimelineStep = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string}) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">
            {icon}
        </div>
        <div>
            <h5 className="font-semibold text-gray-800">{title}</h5>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    </div>
)
