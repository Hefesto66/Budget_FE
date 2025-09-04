
import Image from 'next/image';
import type { SolarCalculationInput, SolarCalculationResult } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface ProposalDocumentProps {
  results: SolarCalculationResult;
  formData: SolarCalculationInput;
  companyData: CompanyFormData;
}

export function ProposalDocument({ results, formData, companyData }: ProposalDocumentProps) {
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
          <h1 className="text-lg font-bold uppercase">{companyData.name}</h1>
          <p>{formatAddress(companyData.address)}</p>
          <p>CNPJ: {companyData.cnpj}</p>
          <p>Email: {companyData.email}</p>
          <p>Telefone: {companyData.phone}</p>
        </div>
      </header>

      <main className="py-8">
        {/* Proposal Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-primary uppercase">Proposta de Sistema Fotovoltaico</h2>
          <p className="text-gray-500">Documento gerado em: {today.toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Client Info Placeholder */}
        <section className="mb-8">
          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2">Preparado para:</h3>
            <p className="font-semibold">Cliente Final (Nome)</p>
            <p>Endereço da Instalação (Rua, Número, Bairro)</p>
            <p>Cidade - Estado, CEP</p>
            <p>CPF/CNPJ: 000.000.000-00</p>
          </div>
        </section>

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
        <section className="mb-8">
          <h3 className="font-bold text-lg text-primary mb-2 border-b border-gray-200 pb-1">Descrição do Sistema e Investimento</h3>
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
                    <p className="font-semibold">Módulo Fotovoltaico {formData.fabricante_modulo}</p>
                    <p className="text-xs text-gray-500">Potência: {formData.potencia_modulo_wp}Wp | Garantia: {formData.garantia_defeito_modulo_anos} anos (produto), {formData.garantia_geracao_modulo_anos} anos (geração)</p>
                </td>
                <td className="py-2 text-center">{results.dimensionamento.quantidade_modulos}</td>
                <td className="py-2 text-right">{formatCurrency(formData.preco_modulo_reais)}</td>
                <td className="py-2 text-right">{formatCurrency(custoModulos)}</td>
              </tr>
               <tr className="border-b border-gray-200">
                <td className="py-2">
                    <p className="font-semibold">Inversor {formData.fabricante_inversor} {formData.modelo_inversor}</p>
                    <p className="text-xs text-gray-500">Potência: {formData.potencia_inversor_kw}kW | Tensão: {formData.tensao_inversor_v}V | Garantia: {formData.garantia_inversor_anos} anos</p>
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
                  <div className="flex justify-between font-bold text-lg bg-green-100 p-3 rounded">
                      <span>Total:</span>
                      <span>{formatCurrency(results.financeiro.custo_sistema_reais)}</span>
                  </div>
              </div>
          </div>
        </section>

         {/* Financial Summary */}
        <section>
             <h3 className="font-bold text-lg text-primary mb-2 border-b border-gray-200 pb-1">Análise Financeira e de Geração</h3>
            <div className="grid grid-cols-2 gap-8">
                 <div>
                    <h4 className="font-bold mb-2">Resumo Financeiro</h4>
                    <div className="space-y-1 text-sm">
                        <InfoRow label="Conta de Luz Média Atual" value={formatCurrency(results.conta_media_mensal_reais.antes)} />
                        <InfoRow label="Conta de Luz Média Estimada" value={formatCurrency(results.conta_media_mensal_reais.depois)} highlight />
                        <InfoRow label="Economia Mensal Estimada" value={formatCurrency(results.economia_mensal_reais)} />
                        <InfoRow label="Economia no 1º Ano" value={formatCurrency(results.economia_primeiro_ano)} />
                        <InfoRow label="Tempo de Retorno (Payback)" value={`${formatNumber(results.payback_simples_anos, 1)} anos`} highlight />
                    </div>
                </div>
                 <div>
                    <h4 className="font-bold mb-2">Desempenho do Sistema</h4>
                    <div className="space-y-1 text-sm">
                        <InfoRow label="Potência do Sistema" value={`${formatNumber(results.dimensionamento.potencia_sistema_kwp, 2)} kWp`} />
                        <InfoRow label="Geração Média Mensal" value={`${formatNumber(results.geracao.media_mensal_kwh, 0)} kWh`} />
                        <InfoRow label="Consumo Mensal do Cliente" value={`${formatNumber(formData.consumo_mensal_kwh, 0)} kWh`} />
                    </div>
                </div>
            </div>
        </section>
      </main>

       {/* Footer */}
      <footer className="pt-8 text-xs text-gray-500 text-center border-t-2 border-gray-200 mt-auto">
          <p>Esta é uma proposta comercial. Os valores e estimativas de geração são baseados nos dados fornecidos e podem variar.</p>
          <p>Condições de pagamento a combinar. | {companyData.name} - Todos os direitos reservados &copy; {today.getFullYear()}</p>
      </footer>
    </div>
  );
}

const InfoRow = ({ label, value, highlight = false } : { label: string; value: string; highlight?: boolean }) => (
    <div className={`flex justify-between py-1.5 border-b border-gray-100 ${highlight ? 'font-bold' : ''}`}>
        <span>{label}:</span>
        <span className={highlight ? 'text-green-600' : ''}>{value}</span>
    </div>
)
