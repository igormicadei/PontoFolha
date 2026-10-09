# Manual de cálculo da folha de pagamento brasileira — 2026

**Versão:** 1.1  
**Data de referência normativa:** 9 de outubro de 2026  
**Escopo principal:** empregado regido pela CLT no setor privado, residente fiscal no Brasil, com folha mensal processada sob as regras gerais do RGPS/eSocial.  
**Objetivo:** permitir que uma pessoa reconstrua e confira os principais cálculos de um holerite, inclusive quando houver férias parciais, adiantamentos, 13º salário, PLR, salário-família, verbas variáveis, descontos e mais de um demonstrativo no mês.

> **Limite de abrangência:** não existe uma tabela única capaz de classificar automaticamente todo pagamento possível. A classificação depende da natureza jurídica real da verba, do tipo de vínculo e, em alguns casos, de condições documentais, acordo coletivo, decisão judicial ou regras específicas. Este manual cobre as verbas mais comuns e apresenta o método para classificar as demais. Regimes próprios de servidores públicos, trabalho no exterior, expatriados, pagamentos judiciais/RRA complexos, stock options, categorias profissionais especiais e situações com decisão judicial exigem análise própria. Não se deve confiar somente no nome usado no holerite.

---

## 1. As regras fundamentais

### 1.1 Um pagamento não tem uma única classificação tributária

Cada rubrica deve ser analisada em colunas independentes:

- **INSS do empregado:** entra ou não na base do salário de contribuição do trabalhador.
- **IRRF:** é rendimento tributável, isento, sujeito à tributação exclusiva ou sujeito a regime específico?
- **FGTS:** integra ou não a base de depósito do empregador?
- **Remuneração trabalhista:** integra ou não a remuneração para reflexos trabalhistas, como férias, 13º e repouso semanal? Essa pergunta é relacionada, mas não é idêntica às anteriores.
- **Momento/período de apuração:** o valor é tributado quando pago, na competência em que é devido, na competência de gozo de férias, na quitação do 13º ou segundo outro marco legal?

A rubrica pode, por exemplo, ser tributável para IRRF e não integrar INSS/FGTS. O prêmio genuíno por desempenho extraordinário é um exemplo típico: pode ficar fora dos encargos trabalhistas/previdenciários conforme a CLT, mas continua sendo rendimento tributável para imposto de renda.

### 1.2 O nome da rubrica e a quantidade de holerites não alteram a lei

Duas folhas ou dois recibos não criam duas isenções por si só. O cálculo usa a natureza da verba e a regra de apuração que se aplica a ela. Pagamentos comuns feitos pela mesma fonte pagadora no mesmo mês normalmente precisam ser considerados em conjunto para a retenção mensal de IRRF, com compensação do que já foi retido. Há, porém, rendimentos com tratamento legal próprio, como férias, 13º e PLR.

### 1.3 Não misture competência, data do pagamento e data de emissão do recibo

Essas datas podem ser diferentes:

- **Competência:** período a que a remuneração corresponde.
- **Data de pagamento:** quando o dinheiro foi efetivamente pago ou colocado à disposição.
- **Recibo/holerite:** documento que discrimina os eventos.

O INSS e o FGTS sobre férias gozadas são apropriados de acordo com os dias de férias em cada competência. O IRRF sobre a remuneração de férias é calculado no pagamento antecipado, em separado dos outros rendimentos, observadas as regras de férias. Portanto, é possível que uma rubrica produza incidência em momentos diferentes para tributos diferentes.

### 1.4 Encargos do empregador não são descontos do empregado

Em uma folha comum, o **INSS patronal**, o RAT e as contribuições a terceiros são obrigações do empregador. O **FGTS também é depósito do empregador**, normalmente à alíquota de 8% para o empregado CLT comum. Eles não devem ser subtraídos do salário líquido do trabalhador. Um holerite pode exibi-los como informação, mas isso não transforma esses valores em descontos do empregado. Regimes específicos podem ter formas de recolhimento diferentes, sem alterar esse princípio geral.

---

## 2. Tabela de contribuição ao INSS do empregado — 2026

Tabela válida desde a competência janeiro de 2026 para empregado, empregado doméstico e trabalhador avulso, segundo o [INSS — Tabela de contribuição mensal](https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal).

| Faixa do salário de contribuição mensal | Alíquota marginal |
|---|---:|
| Até R$ 1.621,00 | 7,5% |
| De R$ 1.621,01 a R$ 2.902,84 | 9% |
| De R$ 2.902,85 a R$ 4.354,27 | 12% |
| De R$ 4.354,28 a R$ 8.475,55 | 14% |
| Acima de R$ 8.475,55 | Não há contribuição adicional do empregado sobre o excedente para o RGPS |

**Teto do salário de contribuição em 2026:** R$ 8.475,55 por competência para a apuração mensal. O desconto máximo aproximado obtido pela aplicação progressiva à tabela é R$ 988,09, sujeito ao arredondamento operacional da folha.

### 2.1 A alíquota é progressiva, não uma alíquota única sobre todo o salário

A alíquota da faixa mais alta não é aplicada retroativamente ao salário inteiro. Para base mensal `B`, a contribuição pode ser representada por:

```text
INSS(B) =
  7,5% × min(B, 1.621,00)
+ 9,0% × max(0, min(B, 2.902,84) − 1.621,00)
+ 12%  × max(0, min(B, 4.354,27) − 2.902,84)
+ 14%  × max(0, min(B, 8.475,55) − 4.354,27)
```

A base deve ser limitada ao teto para o cálculo do empregado. Calcule em precisão suficiente e arredonde o resultado em centavos conforme o sistema de folha e as regras de arrecadação. Diferenças de um centavo podem surgir se alguém arredondar cada faixa separadamente em vez de arredondar só o resultado final.

### 2.2 O que compõe a base mensal do INSS

Em regra, entram as verbas remuneratórias destinadas a pagar o trabalho ou o tempo à disposição do empregador: salário-base, horas extras, descanso semanal remunerado sobre variáveis, adicionais salariais, comissões, gratificações remuneratórias, variáveis de produtividade e férias gozadas com o respectivo terço constitucional. O enquadramento deve seguir o art. 28 da [Lei nº 8.212/1991](https://www.planalto.gov.br/ccivil_03/leis/l8212compilado.htm) e a tabela de incidências do [eSocial](https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-nt-07-2026/tabelas.html).

Não se deve incluir automaticamente tudo o que aparece como crédito: salário-família, PLR regular nos termos da lei, reembolsos genuínos e várias verbas indenizatórias ficam fora da base, conforme as condições legais.

### 2.3 Mais de um vínculo de emprego

Se o empregado tiver remunerações em mais de um vínculo concomitante, as bases de contribuição do mês devem ser consideradas em conjunto e respeitar o teto. Como uma empresa pode não conhecer o que a outra reteve, o trabalhador deve informar aos empregadores os vínculos e valores necessários ao ajuste, para evitar contribuição abaixo ou acima do devido. A regra do 13º é própria e não se soma à remuneração mensal normal para fins de enquadramento da tabela.

### 2.4 Férias e INSS

O pagamento antecipado do recibo de férias **não é uma nova competência independente para o INSS**. A remuneração de férias gozadas — incluindo a parcela proporcional do terço constitucional — deve integrar a base previdenciária da(s) competência(s) em que as férias são gozadas. Se o período cruza dois meses, a folha apropria a remuneração e o terço de acordo com os dias de gozo em cada competência.

Quando a pessoa trabalha parte do mês e goza férias no restante, a base da competência deve reunir as verbas sujeitas a INSS relativas àquele mês, tanto dos dias trabalhados quanto dos dias de férias, mais o terço constitucional correspondente, até o teto mensal. O desconto de INSS feito no fechamento da folha pode, assim, ser maior do que seria olhando isoladamente apenas o salário proporcional aos dias trabalhados.

### 2.5 13º salário e INSS

A contribuição previdenciária do 13º é calculada em uma apuração separada da folha mensal normal, com a tabela progressiva e o teto próprios do 13º. Não se soma o 13º ao salário de dezembro para escolher uma única faixa mensal. O INSS do 13º é calculado sobre o total devido de 13º, considerando os adiantamentos, na folha de 13º/quitação correspondente.

---

## 3. Tabela de IRRF mensal — 2026

Tabela progressiva mensal divulgada pela [Receita Federal — Tributação de 2026](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026), vigente desde janeiro de 2026.

| Base de cálculo mensal do IRRF | Alíquota | Parcela a deduzir |
|---|---:|---:|
| Até R$ 2.428,80 | 0% | R$ 0,00 |
| De R$ 2.428,81 a R$ 2.826,65 | 7,5% | R$ 182,16 |
| De R$ 2.826,66 a R$ 3.751,05 | 15% | R$ 394,16 |
| De R$ 3.751,06 a R$ 4.664,68 | 22,5% | R$ 675,49 |
| Acima de R$ 4.664,68 | 27,5% | R$ 908,73 |

Parâmetros adicionais de 2026:

| Item | Valor/regra |
|---|---:|
| Dedução mensal por dependente elegível | R$ 189,59 |
| Limite do desconto simplificado mensal | R$ 607,20 |
| Parcela mensal isenta específica para aposentadoria/pensão elegível a partir de 65 anos | R$ 1.903,98 |

A isenção específica para maiores de 65 anos é restrita aos rendimentos previdenciários expressamente previstos na lei; não é uma isenção geral sobre salário de empregado.

### 3.1 Nova redução mensal de IRRF a partir de janeiro de 2026

Além da tabela progressiva, aplica-se a redução criada pela [Lei nº 15.270/2025](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm), conforme os exemplos oficiais da Receita Federal:

| Rendimentos tributáveis sujeitos à incidência mensal | Redução do imposto calculado |
|---|---|
| Até R$ 5.000,00 | Redução limitada ao próprio imposto, de modo que o IRRF seja zero |
| De R$ 5.000,01 a R$ 7.350,00 | `R$ 978,62 − (0,133145 × rendimentos tributáveis sujeitos à incidência mensal)` |
| Acima de R$ 7.350,00 | Sem essa redução |

A redução nunca pode deixar o imposto abaixo de zero. Ela incide **depois** do cálculo pela tabela progressiva e fica limitada ao imposto calculado. Para determinar a faixa de renda da redução, usa-se o rendimento tributável relevante, não a base após deduções. Consulte os [exemplos oficiais da Receita Federal](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/exemplos-de-aplicacao-da-lei-15-270-2025).

**Atenção:** não confunda a tabela de base de cálculo (que usa a base após deduções) com a faixa da redução nova (que se refere aos rendimentos tributáveis). São etapas diferentes.

### 3.2 Deduções usadas antes da tabela mensal

Para a apuração normal mensal, compare:

1. **Deduções legais correspondentes àquele rendimento**, quando cabíveis; ou
2. **Desconto simplificado mensal de R$ 607,20**, que substitui as deduções legais, caso seja mais vantajoso.

Não some o desconto simplificado às deduções legais. As deduções legais mais comuns são:

- contribuição oficial para a Previdência Social (INSS), atribuível ao rendimento calculado;
- pensão alimentícia paga em dinheiro quando decorre de decisão judicial, acordo homologado judicialmente ou escritura pública admitida na legislação — não qualquer ajuda voluntária;
- dedução mensal por dependente elegível, quando a opção legal for utilizada;
- contribuições qualificadas a previdência complementar/Fapi, se cumpridos os requisitos e limites legais.

Despesas médicas, odontológicas, farmácia, coparticipação de plano de saúde, despesas escolares e consignados **não devem ser subtraídos automaticamente da base mensal de IRRF**. Em muitos casos, certas despesas médicas ou de instrução só são consideradas na declaração anual; empréstimos e coparticipações são normalmente apenas descontos de valor líquido.

### 3.3 Fórmula geral do IRRF mensal

Para cada grupo de rendimentos ao qual a lei manda aplicar a tabela mensal:

1. Some os rendimentos tributáveis pertencentes àquele grupo.
2. Determine as deduções legais permitidas e correspondentes; compare-as com o desconto simplificado permitido.
3. `Base IRRF = máximo(0, rendimentos tributáveis − deduções escolhidas)`.
4. Aplique a faixa da tabela progressiva: `imposto inicial = base × alíquota − parcela a deduzir`, nunca abaixo de zero.
5. Aplique, quando cabível, a redução mensal de 2026, limitada ao imposto inicial.
6. Subtraia retenções anteriores relativas ao mesmo grupo/rendimento, quando a regra exigir recálculo cumulativo no mês.

A aplicação concreta deve respeitar as separações legais descritas nas seções seguintes. Não execute essa fórmula uma única vez sobre todos os créditos do holerite indiscriminadamente.

---

## 4. IRRF de salário, férias, 13º e PLR não é uma só conta

### 4.1 Salário e pagamentos ordinários

Para rendimentos comuns sujeitos ao ajuste mensal, a regra geral é considerar os pagamentos tributáveis realizados pela mesma fonte pagadora no mês e recalcular quando houver mais de um pagamento, compensando o IRRF já retido. Adiantamentos salariais também precisam ser tratados conforme o momento em que o rendimento é integralmente pago: se o adiantamento e o saldo forem pagos dentro do mesmo mês, a retenção é calculada sobre o conjunto pertinente; se o rendimento não for integralmente pago no próprio mês, pode haver retenção já no adiantamento.

Um adiantamento salarial não é uma verba nova tributável por si só: é parte do salário. Na folha de fechamento, seu desconto compensa o dinheiro já entregue, mas não apaga o salário da base tributável.

### 4.2 Férias gozadas: IRRF separado do salário mensal

Pelo art. 29 da [IN RFB nº 1.500/2014](https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=57670&visao=anotado), o pagamento de férias, inclusive o adicional constitucional de 1/3, tem o IR calculado no mês do pagamento, **em separado de qualquer outro rendimento pago no mês**. A regra também se aplica à remuneração de férias paga em dobro e, em situações previstas na norma, a férias indenizadas na rescisão, embora a natureza indenizatória possa determinar isenção conforme o tipo de verba.

No cálculo do IRRF de férias, a base inclui a remuneração de férias e o terço constitucional pertinente. Podem ser usadas apenas as deduções legalmente permitidas e correspondentes a esse rendimento. A folha deve evitar usar duas vezes a mesma contribuição previdenciária ou a mesma dedução como se ela pudesse ser integralmente atribuída a vários grupos de rendimentos.

O recibo de férias normalmente é pago até dois dias antes do início do gozo, conforme o art. 145 da CLT. O IRRF é apurado no pagamento antecipado. Depois, a folha mensal registra as rubricas de férias da competência e o desconto do adiantamento para compensar o valor já entregue. O desconto do adiantamento não deve provocar novo IRRF sobre o mesmo pagamento já tributado.

**Por que isso importa para o limite de R$ 5.000 de 2026?** O cálculo do IRRF sobre férias não deve ser fundido automaticamente ao cálculo de salário normal apenas porque ambos aparecem no mesmo mês. O rendimento de férias tem cálculo separado na fonte. Consequentemente, a retenção que aparece no mês pode não ser igual àquela que resultaria de somar todos os rendimentos ordinários em uma única conta. Isso não transforma férias em rendimento isento para sempre: na **declaração anual**, a Receita determina que férias sejam tributadas em conjunto com os demais rendimentos tributáveis sujeitos ao ajuste anual. A retenção na fonte é antecipação; a declaração anual pode apurar diferença a pagar ou restituição.

### 4.3 13º salário: tributação exclusiva na fonte

O 13º tem folha e cálculo de IRRF próprios, separados dos demais rendimentos. Usa-se a tabela progressiva mensal vigente no mês de quitação (normalmente dezembro ou a rescisão), com as deduções correspondentes ao próprio 13º, como contribuição previdenciária incidente sobre o 13º, pensão alimentícia dedutível e outras deduções expressamente permitidas. Pode-se usar, em substituição às deduções legais cabíveis, o desconto simplificado aplicável, se for mais benéfico.

A Lei nº 15.270/2025 determina expressamente que a nova redução também é aplicada no cálculo do imposto cobrado exclusivamente na fonte sobre o 13º. Por isso, em 2026, o 13º de até R$ 5.000 pode ter IRRF zerado pela redução, se o imposto calculado for inteiramente absorvido por ela; a faixa de R$ 5.000,01 a R$ 7.350 usa a fórmula de redução indicada na seção 3.1.

O 13º não é somado ao salário mensal para calcular INSS nem para o IRRF mensal normal. Também não é somado novamente aos rendimentos sujeitos ao ajuste anual como se fosse salário ordinário: a tributação do 13º é exclusiva na fonte, com tratamento próprio.

A primeira parcela/adiantamento do 13º normalmente não sofre retenção de IRRF nem desconto previdenciário definitivo naquele momento; a apuração ocorre sobre o total devido na folha específica do 13º/quitação, com compensação do adiantamento. O FGTS sobre o valor antecipado é recolhido conforme as regras de FGTS da competência do pagamento. Consulte as [perguntas frequentes do eSocial sobre o 13º](https://www.gov.br/esocial/pt-br/empregador-domestico/perguntas-frequentes/perguntas-frequentes).

### 4.4 Participação nos Lucros ou Resultados (PLR)

A PLR que cumpra os requisitos da [Lei nº 10.101/2000](https://www.planalto.gov.br/ccivil_03/leis/l10101.htm) não integra o salário de contribuição do INSS e não é base de FGTS. Para IRRF, possui tabela exclusiva e separada, diferente da tabela mensal do salário. Pagamentos de PLR feitos em parcelas no mesmo ano devem ser controlados cumulativamente segundo a regra da tabela anual de PLR; o imposto calculado sobre o total pertinente é ajustado pelo que já foi retido.

**Tabela de IRRF da PLR — valores atualmente publicados pela Receita Federal (faixas anuais):**

| PLR total considerado na tabela | Alíquota | Parcela a deduzir |
|---|---:|---:|
| Até R$ 8.214,40 | 0% | R$ 0,00 |
| De R$ 8.214,41 a R$ 9.922,28 | 7,5% | R$ 616,08 |
| De R$ 9.922,29 a R$ 13.167,00 | 15% | R$ 1.360,25 |
| De R$ 13.167,01 a R$ 16.380,38 | 22,5% | R$ 2.347,78 |
| Acima de R$ 16.380,38 | 27,5% | R$ 3.166,80 |

Fonte: [Receita Federal — Tributação de 2026](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026). A nova redução mensal de 2026 não deve ser aplicada automaticamente à PLR: ela tem tabela específica de tributação exclusiva. Se o pagamento chamado de PLR não cumprir a Lei nº 10.101/2000, não basta manter o rótulo “PLR”; a verba pode ter de ser reclassificada como remuneração normal, com outros encargos.

### 4.5 Rendimentos recebidos acumuladamente (RRA) e decisões judiciais

Valores referentes a vários meses, pagos acumuladamente, podem seguir o regime próprio de RRA, com cálculo considerando o número de meses a que os rendimentos se referem, deduções permitidas e opção legal entre formas de tributação quando aplicável. Não se deve tratar uma condenação trabalhista acumulada como um bônus mensal ordinário sem separar principal, juros, honorários/despesas dedutíveis e natureza de cada parcela. Esse cenário requer o capítulo específico da IN RFB nº 1.500/2014 e, se necessário, análise profissional.

---

## 5. Tabela prática de incidência das verbas mais comuns

A matriz abaixo é um ponto de partida para o empregado CLT comum. **“Sim” e “Não” pressupõem que a verba tenha realmente a natureza descrita.** Se o nome da rubrica esconder remuneração, se houver pagamento acima do limite legal ou se faltarem os requisitos de uma isenção, a incidência pode mudar.

| Verba | INSS do empregado | IRRF | FGTS | Observações essenciais |
|---|---|---|---|---|
| Salário-base e saldo de salário | Sim | Tributação mensal normal | Sim | Base mensal, somada às demais verbas remuneratórias da competência. |
| Horas extras e reflexos em DSR | Sim | Mensal normal | Sim | O fato de serem variáveis não as torna indenizatórias. |
| Adicional noturno, insalubridade, periculosidade | Sim | Mensal normal | Sim | Quando devidos como adicionais remuneratórios. |
| Comissão, gratificação remuneratória, produtividade, bônus contratual | Em regra, sim | Em regra, mensal normal | Em regra, sim | Avaliar a natureza real; uma verba não vira indenização só por ser ocasional ou ter nome de “prêmio”. |
| Prêmio genuíno por desempenho superior ao ordinariamente esperado, nos requisitos da CLT | Em regra, não integra a remuneração/encargos previdenciários | Em regra, é rendimento tributável de IR | Em regra, fora da base quando atende à natureza legal de prêmio | Precisa satisfazer os requisitos legais. Prêmio fictício que substitui salário pode ser reclassificado. |
| Férias gozadas — remuneração correspondente aos dias de gozo | Sim, na(s) competência(s) do gozo | Sim; calculado em separado na fonte | Sim, na(s) competência(s) do gozo | O adiantamento não é uma competência separada de INSS/FGTS. |
| Terço constitucional de férias gozadas | Sim | Sim, junto do cálculo separado de férias | Sim | Incide em férias gozadas. Não confundir com férias indenizadas na rescisão. |
| Adiantamento em dinheiro de férias antes do início | Não é base previdenciária/FGTS na data do adiantamento | IRRF no pagamento, pela regra própria de férias | Não é base de FGTS no evento de adiantamento | A remuneração de férias é apropriada em INSS/FGTS à medida que os dias são gozados; no holerite mensal, o adiantamento é compensado. |
| Abono pecuniário — venda legal de até 1/3 das férias e parcelas legalmente relacionadas | Em regra, não | Em regra, isento, observados os limites e a natureza correta | Em regra, não | Não confundir com terço constitucional das férias gozadas, nem com abono salarial/abono contratual genérico. |
| Férias indenizadas vencidas/proporcionais e terço correspondente na rescisão | Em regra, não | Em regra, isentas quando efetivamente indenizatórias e enquadradas na legislação | Em regra, não | Pagamento de férias gozadas durante o contrato tem tratamento diferente. Conferir discriminação no TRCT. |
| 13º salário | Sim, em base separada do salário mensal | Sim, tributação exclusiva na fonte | Sim | INSS e IRRF do 13º têm apuração própria. |
| Adiantamento da primeira parcela do 13º | Normalmente o desconto previdenciário fica para a apuração do total do 13º | Normalmente sem retenção definitiva na antecipação; IR na quitação | FGTS conforme o pagamento do adiantamento | Não some o 13º à base mensal normal. |
| PLR válida sob a Lei nº 10.101/2000 | Não | Sim, tabela exclusiva da PLR | Não | Controle anual/cumulativo da PLR; não aplicar a tabela mensal normal. |
| Salário-família, dentro dos valores e condições legais | Não | Não tributável | Não | Benefício legal, não remuneração. Valor e limite são atualizados por portaria. |
| Salário-maternidade | Tem regra específica e integra a base do segurado conforme legislação previdenciária aplicável | Em regra, tributável como rendimento do trabalho/benefício conforme pagador e regime | Incidências específicas conforme a rubrica e o período | Não reutilize automaticamente a regra de benefício por incapacidade; confira a categoria e os leiautes atuais do eSocial. |
| Benefício previdenciário pago diretamente pelo INSS (ex.: auxílio por incapacidade) | Não é salário pago pelo empregador para INSS do empregado | Pode ser rendimento tributável conforme a espécie; verificar informe do INSS | Em regra, não; há regras próprias em afastamento acidentário para depósitos de FGTS pelo empregador | O pagamento feito pelo INSS não é rubrica salarial comum da folha da empresa. |
| Pagamento dos primeiros 15 dias de afastamento por doença comum | Regra específica; não classificar automaticamente como salário comum | Conferir a natureza/entendimento vigente e rubrica informada | Depende da espécie de afastamento e regra de FGTS aplicável | Situação com controvérsia e decisões judiciais; exigir rubrica específica do eSocial. |
| Vale-transporte concedido na forma legal | Não | Em regra, não tributável | Não | A participação do trabalhador (até o limite legal) reduz o líquido, não a base de INSS/IRRF. Pagamento em dinheiro fora das condições legais pode alterar o tratamento. |
| Vale-alimentação/refeição não pago em dinheiro, atendidas as condições legais | Em regra, não | Em regra, não como remuneração salarial | Em regra, não | Auxílio-alimentação pago em dinheiro ou usado como salário disfarçado exige reavaliação. |
| Plano de saúde/odontológico coletivo e reembolso médico real, conforme os requisitos legais | Em regra, não | Em regra, não é remuneração tributável do empregado | Em regra, não | Coparticipação descontada do empregado normalmente reduz o líquido, mas não a base mensal do IRRF. A dedução médica costuma ser tratada na declaração anual, quando admitida. |
| Reembolso real de viagem, material, quilometragem ou despesa a serviço | Em regra, não, se realmente reembolso | Depende da natureza e da comprovação; não presumir isenção universal | Em regra, não, se não remuneratório | Deve corresponder a gasto/necessidade de serviço e ser documentado. Valor fixo sem prestação de contas pode ser remuneração disfarçada. |
| Diárias de viagem | Em regra, fora da base previdenciária sob a legislação atual | Depende da finalidade, natureza e requisitos fiscais | Em regra, não se tiver natureza não remuneratória | O antigo limite de 50% para INSS não deve ser usado automaticamente como regra atual; IRRF e INSS têm regras próprias. |
| Ajuda de custo real por mudança de local de trabalho, em parcela única, nos requisitos legais | Em regra, não | Depende do enquadramento e da finalidade comprovada | Em regra, não se indenizatória | Parcela mensal recorrente e sem vínculo com despesa real pode ser reclassificada. |
| Auxílio-creche/reembolso-creche | Em regra, não se atender aos requisitos | Depende da forma e requisitos legais | Em regra, não se não remuneratório | Conferir idade, finalidade, documentação e regra específica aplicável. |
| Habitação, veículo ou benefício em espécie de uso pessoal concedido como remuneração | Pode integrar | Pode ser rendimento tributável, inclusive como salário indireto | Pode integrar | Benefício de trabalho e utilidade pessoal não são sempre a mesma coisa. Avaliar finalidade e habitualidade. |
| Empréstimo ou adiantamento recuperável do empregador | Não é remuneração por si só | Não é rendimento por si só se for empréstimo real a devolver | Não | A devolução/consignação reduz o valor líquido, não a base. Se não existir obrigação real de restituição, pode haver reclassificação. |
| Desconto de convênio, seguro, refeição, transporte, sindicato, consignado ou empréstimo | Não reduz, por si só, a base previdenciária | Não reduz, por si só, a base mensal de IRRF | Não altera a base de FGTS por si só | Afeta o líquido, salvo dedução fiscal expressamente autorizada. |
| Pensão alimentícia legalmente dedutível | Não reduz INSS nem FGTS | Pode reduzir a base do IRRF se cumprir a forma legal | Não reduz a base de FGTS | O valor descontado do líquido e o valor admitido como dedução fiscal devem corresponder à documentação legal. |
| Multa de 40% do FGTS e saque do FGTS | Não | Em regra, isentos | Não são novas verbas sobre as quais se deposita FGTS | Verbas rescisórias têm classificação própria. |
| Aviso-prévio trabalhado | Sim | Mensal normal | Sim | É remuneração do período trabalhado. |
| Aviso-prévio indenizado | Em regra, não para INSS | Em regra, isento de IR como indenização, conforme a natureza e o enquadramento | Pode integrar a base de FGTS conforme a regra específica | Não confundir incidência de FGTS com INSS/IR. |
| Indenização por dano, multa ou verba rescisória | Depende da parcela legal específica | Depende da natureza e do fundamento | Depende da lei/regra específica | Não existe regra única para todas as parcelas do TRCT. Separe cada item pelo fundamento legal. |

**Fontes centrais para validar incidências:** [Lei nº 8.212/1991, art. 28](https://www.planalto.gov.br/ccivil_03/leis/l8212compilado.htm), [tabela de incidência de contribuições da Receita Federal](https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/pagamentos-e-parcelamentos/emissao-e-pagamento-de-darf-das-gps-e-dae/calculo-de-contribuicoes-previdenciarias-e-emissao-de-gps/tabela-de-incidencia-de-contribuicao), [tabelas de rubricas do eSocial](https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-nt-07-2026/tabelas.html) e [Lei nº 10.101/2000](https://www.planalto.gov.br/ccivil_03/leis/l10101.htm).

---

## 6. Salário-família — limite e competência

Para 2026, a tabela oficial do [INSS — salário-família](https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-familia/valor-limite-para-direito-ao-salario-familia) informa:

| Parâmetro | Valor desde 1º/1/2026 |
|---|---:|
| Remuneração mensal máxima para direito à cota | R$ 1.980,38 |
| Cota por dependente elegível | R$ 67,54 |

Há condições adicionais de dependência, idade, documentação e categoria de segurado. O valor deve ser revisto quando houver nova portaria; não reutilize automaticamente os números de 2026 em outro ano.

A regra oficial afirma que se considera a remuneração mensal do segurado como o **valor total do respectivo salário de contribuição**, inclusive a soma de salários de contribuição de atividades simultâneas. Se a remuneração mensal ultrapassar o limite, não há direito à cota daquele mês.

### Férias parciais no meio do mês

Não se verifica o limite usando somente os dias trabalhados, nem se calcula o limite separadamente por holerite. Deve-se apurar a remuneração mensal que compõe o salário de contribuição conforme as regras da competência, incluindo remuneração de férias gozadas e o terço constitucional que integra essa base. Portanto, férias parciais podem alterar a remuneração considerada no mês; a existência de um recibo separado não preserva automaticamente o direito ao benefício.

O salário-família legal, por outro lado, não integra a base de INSS, IRRF ou FGTS: ele é um benefício pago ao empregado elegível, e não um componente do salário tributável.

---

## 7. FGTS: o que muda e o que não muda no líquido

Para um empregado CLT comum, o depósito mensal de FGTS é obrigação do empregador e não desconto sobre o salário líquido. Em regra, o empregador deposita 8% da base legal, que inclui as verbas salariais devidas e, conforme a competência, férias gozadas e terço constitucional, além do 13º em base própria. A alíquota e as condições podem variar em regimes específicos.

O FGTS segue a competência. O [Ministério do Trabalho e Emprego — Perguntas frequentes do FGTS Digital](https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/perguntas-frequentes) esclarece que o FGTS sobre férias e o terço constitucional deve ser declarado proporcionalmente aos dias de gozo nas competências respectivas. Adiantamento de férias pago antes do início do período e remuneração de férias apropriada no mês de gozo são eventos de naturezas diferentes para o registro.

Não subtraia 8% do salário bruto ao calcular o salário líquido: esse valor é um depósito da empresa. Se o holerite exibir “FGTS do mês” apenas informativamente, ele não deve reduzir o líquido.

---

## 8. Como montar o cálculo de um mês com férias parciais

## 8.1 Como calcular a remuneração bruta das férias e as médias de horas extras

Esta etapa é **trabalhista e vem antes dos cálculos de INSS, IRRF e FGTS**. Primeiro se determina a remuneração bruta das férias; depois cada verba é classificada e tributada segundo sua regra própria.

### Regra legal

O art. 142 da [CLT](https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm#art142) determina que o empregado receba nas férias a remuneração devida na data da concessão. O § 5º manda computar os adicionais por trabalho extraordinário, noturno, insalubre ou perigoso na base das férias. Para horas extras habituais, a [Súmula 347 do TST](https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf?version=1.13) estabelece a apuração pela quantidade de horas efetivamente prestadas, aplicando-se a elas o salário-hora vigente na época do pagamento da verba reflexa.

Na prática, para horas extras remuneradas por hora, a regra padrão é apurar a **média física de horas** do período de referência e convertê-la em dinheiro pelo valor da hora extra aplicável na data da concessão das férias. Não se deve simplesmente somar o dinheiro de horas extras pago em cada mês e dividir por 12 sem considerar a evolução salarial: esse método pode deixar de refletir o salário-hora vigente.

### Passo a passo para horas extras

1. **Defina o período de referência.** Para férias adquiridas em um período completo, use como ponto de partida o período aquisitivo de 12 meses que gerou aquele direito. Confira a convenção/acordo coletivo e a regra de folha aplicável, pois a norma coletiva pode estabelecer critério próprio mais favorável ou período de média diferente, quando válido.
2. **Levante as horas extras efetivamente prestadas e que devem integrar a remuneração.** Use registros de ponto e folhas, não apenas o valor pago. Não conte como horas extras realizadas aquelas que foram apenas lançadas em banco de horas e compensadas, salvo se houver verba remuneratória efetivamente devida a considerar. Verifique ajustes retroativos, diferenças reconhecidas e horas devidas ainda não pagas.
3. **Separe categorias com adicionais diferentes.** Se houver, por exemplo, horas com adicional de 50%, 60% e 100%, noturnas ou com regras específicas de domingos/feriados, não aplique um único percentual médio de forma indiscriminada. Faça o cálculo separado por categoria de horas e pelo adicional que for juridicamente aplicável, respeitando lei, contrato e norma coletiva.
4. **Calcule a média física.** Como regra operacional para um período aquisitivo completo de 12 meses:

   `Média mensal de horas extras = total de horas extras elegíveis no período aquisitivo ÷ 12`

   O divisor precisa refletir o período de referência aplicável. Se o período não for completo, houver afastamentos ou a norma coletiva estabelecer outro método, não aplique automaticamente o divisor 12 sem verificar a regra correspondente.
5. **Determine o valor da hora extra na data da concessão.** Apure o salário-hora vigente com o divisor contratual/legal aplicável e com os componentes salariais que integrem a base de cálculo da hora extra, conforme a legislação e a jurisprudência aplicáveis. Depois aplique o adicional correspondente. Em um caso simples com salário mensal fixo e apenas adicional de 50%: `valor da hora extra atual = salário-hora atual × 1,50`. O percentual legal de 50% é o mínimo geral; contrato ou norma coletiva pode prever adicional superior.
6. **Converta a média em valor de férias.** Para cada categoria: `valor médio de horas extras para férias = média mensal de horas extras × valor atual da hora extra`. Some os resultados das categorias pertinentes.
7. **Verifique DSR e outros reflexos.** O descanso semanal remunerado (DSR) decorrente de horas extras pode constituir parcela remuneratória própria. Verifique se ele já foi calculado e incluído na média/base de férias pelo método adotado; não o omita quando devido nem o some duas vezes. Considere também outros adicionais variáveis que devam integrar as férias, cada qual com seu próprio método legal ou normativo.
8. **Calcule o terço constitucional.** Depois de montar a remuneração de férias — salário fixo correspondente aos dias de férias mais as médias e demais parcelas devidas — calcule o acréscimo constitucional de 1/3 sobre essa remuneração. Portanto, a média de horas extras que compõe as férias também aumenta a base do terço constitucional.
9. **Se as férias forem fracionadas, calcule a parcela correspondente aos dias daquele período.** Determine a remuneração aplicável às férias concedidas naquele intervalo e o terço correspondente. A forma de alocar os valores nas competências e nos recibos não altera o direito à integração da média.

### Exemplo numérico — salário fixo e horas extras a 50%

Hipóteses ilustrativas: empregado mensalista, salário fixo de R$ 2.500, divisor 220, 324 horas extras elegíveis no período aquisitivo completo de 12 meses, todas remuneradas com adicional de 50%, sem alteração do divisor e sem outros componentes na base da hora extra. Para simplificar, o exemplo não calcula DSR sobre horas extras nem outros adicionais variáveis; eles devem ser avaliados à parte quando devidos.

| Etapa | Cálculo | Resultado |
|---|---|---:|
| 1. Média física mensal | 324 ÷ 12 | 27 horas |
| 2. Salário-hora atual | R$ 2.500 ÷ 220 | R$ 11,363636… |
| 3. Valor da hora extra atual | R$ 11,363636… × 1,50 | R$ 17,045455… |
| 4. Média de horas extras a integrar as férias | 27 × R$ 17,045455… | R$ 460,23 |
| 5. Terço constitucional sobre essa parcela | R$ 460,23 ÷ 3 | R$ 153,41 |
| **Total desta parcela nas férias, incluindo o terço** | R$ 460,23 + R$ 153,41 | **R$ 613,64** |

Os valores são arredondados para demonstração; o sistema deve aplicar sua regra de arredondamento de centavos de forma consistente. Os R$ 613,64 são apenas a parcela relativa à média de horas extras e seu reflexo no terço — não o valor total das férias. A remuneração fixa das férias e outros componentes são adicionados separadamente.

### Outras remunerações variáveis: não aplique uma fórmula única a tudo

O art. 142 prevê métodos diferentes conforme a forma de remuneração:

- **Salário pago por hora com jornadas variáveis (§ 1º):** média do período aquisitivo, aplicando o valor do salário vigente na data da concessão.
- **Salário pago por tarefa (§ 2º):** média da produção do período aquisitivo, aplicada à remuneração unitária vigente na concessão.
- **Comissões, percentagens ou viagens (§ 3º):** média percebida nos 12 meses anteriores à concessão das férias.
- **Horas extras e adicionais extraordinários (§ 5º e Súmula 347 do TST):** integrar os adicionais devidos, apurando a média física das horas extras e usando o salário-hora aplicável na época das férias.
- **Adicionais cujo valor não tenha sido uniforme ou que não sejam pagos na mesma base na data das férias (§ 6º):** aplicar o método de média duodecimal e atualização salarial previsto na CLT, conforme a situação concreta.

Essas regras não dispensam a leitura da convenção ou acordo coletivo da categoria, do contrato e das rubricas que compõem a remuneração. Uma verba não deve ser classificada como indenizatória apenas por ser variável, eventual no nome ou paga separadamente.

### Depois da apuração trabalhista, calcule os tributos

A remuneração de férias obtida nesta seção — incluindo a média aplicável e o terço constitucional — deve ser levada às bases de INSS, IRRF e FGTS conforme as regras específicas de cada uma, explicadas nas seções tributárias deste manual. **Não aplique a média física diretamente sobre a base de imposto, nem trate o adiantamento como uma segunda remuneração:** primeiro calcule o valor bruto correto das férias, depois classifique e tribute cada rubrica pelo momento e base previstos em lei.

Considere uma pessoa mensalista que recebe salário fixo e goza parte das férias em um determinado mês. O método é:

1. **Identifique a competência e os dias.** Separe salário dos dias trabalhados e remuneração dos dias de férias gozadas. Se as férias atravessarem dois meses, distribua férias e terço pelas competências conforme os dias de gozo.
2. **Monte a base de INSS da competência.** Some salário proporcional, férias gozadas, terço constitucional e todas as outras rubricas com incidência previdenciária dessa competência. Aplique a tabela progressiva de 2026 e o teto mensal. Não some um adiantamento de férias como uma segunda remuneração; ele é compensação de caixa do que já foi pago.
3. **Monte a base mensal de FGTS.** Inclua as verbas devidas com incidência de FGTS na competência, respeitando a alocação das férias ao mês de gozo. O depósito é obrigação patronal, não desconto do empregado.
4. **Calcule o IRRF do recibo de férias.** No pagamento antecipado, use a base de férias (remuneração de férias + terço correspondente), deduções legalmente permitidas atribuíveis a esse rendimento e a regra específica de cálculo separado. Aplique a tabela progressiva e a redução vigente em 2026, quando cabível. Retenha o imposto no pagamento de férias e registre-o para não cobrar novamente.
5. **Calcule o IRRF da remuneração mensal normal.** Use os rendimentos pertencentes ao grupo mensal comum e as deduções correspondentes. Não incorpore de novo a remuneração de férias já tributada no cálculo separado da fonte, mas respeite qualquer regra de recálculo/compensação aplicável aos pagamentos mensais comuns.
6. **Reconcilie os adiantamentos.** Na folha de fechamento, a remuneração de férias pode reaparecer como rubrica de competência e o adiantamento como débito de compensação. Isso documenta que o valor já foi pago; não é uma nova saída de caixa ao empregado. A mesma retenção de IRRF sobre férias não pode ser cobrada duas vezes.
7. **Calcule o líquido.** Parta das verbas em dinheiro que ainda são devidas no pagamento atual; desconte INSS e IRRF efetivamente devidos neste fechamento, os adiantamentos já pagos e outros descontos autorizados. Considere como já pagos os valores líquidos entregues anteriormente, sem duplicar a retenção tributária que já ocorreu.

### Exemplo estrutural, sem substituir a folha real

Suponha salário fixo mensal de R$ 6.000, férias gozadas por 15 dias dentro da competência e nenhum adicional variável:

- salário dos dias trabalhados: aproximadamente R$ 3.000;
- remuneração de 15 dias de férias: aproximadamente R$ 3.000;
- terço constitucional relativo a esses 15 dias: aproximadamente R$ 1.000;
- remuneração total sujeita à base mensal de INSS antes de outros eventos: aproximadamente R$ 7.000, desde que o período e o processamento correspondam a essa competência.

Nesse caso, a base previdenciária não é apenas R$ 3.000 de salário proporcional. Ela inclui as verbas de férias gozadas e o terço correspondente, até o teto de 2026. Já o IRRF das férias é calculado separadamente no pagamento antecipado; o IRRF do salário mensal é calculado no grupo mensal comum. O líquido final precisa reconciliar o adiantamento recebido. Os valores líquidos exatos dependem das deduções cabíveis, das datas, de variáveis e de outras rubricas, mas as bases não mudam porque a empresa emitiu um ou dois demonstrativos.

---

## 9. Como tratar adiantamentos e créditos/débitos técnicos

Um holerite não é apenas uma lista de dinheiro que entrou e saiu naquela data. Pode ser também a reconciliação das verbas devidas por competência e das quantias já pagas.

### 9.1 Adiantamento salarial

O salário adiantado é parte do salário. O débito “adiantamento salarial” costuma reduzir o valor ainda a pagar, mas não reduz o salário que compõe a base do INSS/IRRF/FGTS. Para IRRF, aplique a regra de momento de pagamento e consolidação mensal descrita na seção 4.1.

### 9.2 Adiantamento de férias

O valor de férias pode aparecer como crédito na folha de competência e, ao lado, como desconto do adiantamento já entregue. Isso não significa que o trabalhador recebeu duas vezes as férias ou que a empresa pode apagar sua incidência tributária. Segundo as orientações operacionais do eSocial:

- no evento de pagamento do adiantamento, as rubricas de férias têm tratamento de IRRF próprio e não são base de INSS/FGTS naquele momento;
- nas competências de gozo, a remuneração de férias e o terço entram nas bases previdenciária e de FGTS correspondentes;
- o desconto do adiantamento compensa a quantia paga anteriormente e não deve gerar nova retenção de IR sobre o mesmo pagamento.

Consulte o [histórico de perguntas frequentes do eSocial sobre férias e rubricas](https://www.gov.br/esocial/pt-br/empresas/perguntas-frequentes/historico-de-perguntas-frequentes) e as [perguntas do FGTS Digital](https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/perguntas-frequentes).

### 9.3 Adiantamento de 13º

O primeiro adiantamento deve ser conciliado com o valor total de 13º. A folha específica da gratificação calcula INSS e IRRF sobre a base própria, desconta o adiantamento e paga o saldo. O fato de o adiantamento ter sido pago em novembro, durante as férias ou em outro mês não faz o 13º passar a compor o salário mensal comum.

### 9.4 Descontos que não reduzem base tributável

Consignado, empréstimo, convênio, seguro, coparticipação de plano de saúde, contribuição associativa e outros descontos voluntários ou contratuais normalmente diminuem apenas o líquido. Não subtraia esses valores da base de INSS ou de IRRF sem uma autorização legal específica. Em contrapartida, a contribuição previdenciária oficial do empregado pode ser dedutível da base do IRRF quando corresponde ao rendimento calculado.

---

## 10. Outros descontos, reembolsos e benefícios

Antes de aplicar qualquer incidência, faça estas perguntas:

1. O valor remunera trabalho, disponibilidade ou resultado normal do emprego?
2. É um prêmio que cumpre os requisitos legais, uma indenização, um benefício assistencial ou um reembolso de despesa real?
3. Existe uma lei específica que manda incluir ou excluir a verba da base do tributo em questão?
4. A documentação prova os requisitos da exclusão?
5. Qual é a competência ou o evento de pagamento exigido pela regra específica?

### Regras práticas

- **Reembolso não é sinônimo de verba isenta.** Um reembolso de gasto de trabalho real, documentado e com natureza não remuneratória costuma ficar fora das bases. Um valor fixo pago indistintamente, sem relação com despesa real e em substituição a salário, pode ser remuneração.
- **Benefício em dinheiro exige atenção.** Vale-transporte tem regra específica que, em regra, não permite pagamento em dinheiro. Auxílio-alimentação tem exclusão trabalhista expressa sob condições, inclusive vedação ao pagamento em dinheiro para o tratamento previsto na CLT. Uma verba que imita um benefício, mas funciona como salário, pode ter incidências diferentes.
- **Prêmios não são a mesma coisa que comissões.** Comissão e bônus contratual normal remuneram resultado do trabalho. Um prêmio genuíno, concedido por desempenho superior ao ordinariamente esperado e dentro do art. 457 da CLT, tem tratamento trabalhista/previdenciário próprio; para IR, isso não significa automaticamente isenção.
- **Abonos têm nomes parecidos e tratamentos diferentes.** Abono pecuniário é venda legal de parte das férias; abono de férias previsto em contrato ou norma coletiva é outra rubrica; abono salarial/PIS é outra coisa. Não aplique a classificação de um a todos.
- **Rescisão deve ser calculada rubrica por rubrica.** Saldo de salário, férias gozadas, férias indenizadas, 13º proporcional, aviso-prévio trabalhado ou indenizado, FGTS, multa de 40%, multa convencional e indenizações podem ter incidências distintas. Um único total “rescisão” é insuficiente para o cálculo fiscal.
- **O eSocial precisa usar as incidências corretas.** As tabelas de rubricas identificam a natureza da verba e suas incidências de INSS/IRRF/FGTS. Para um pagamento fora dos exemplos deste manual, consulte a descrição da rubrica e a tabela vigente em vez de extrapolar por analogia.

---

## 11. Procedimento universal de conferência do holerite

Este procedimento é adequado à maioria das folhas CLT comuns. A principal parte que exige julgamento humano é a classificação legal de cada rubrica.

### Etapa A — Reunir entradas

- salário contratual e competência;
- dias trabalhados, férias gozadas, afastamentos e rescisão, quando houver;
- horas extras, DSR, adicionais, comissões, prêmios, gratificações e demais créditos;
- recibos e datas de adiantamentos de salário, férias e 13º;
- dependentes legais, pensão alimentícia válida e contribuições dedutíveis de previdência complementar, se houver;
- outros vínculos empregatícios no mesmo mês e contribuições já retidas;
- rubricas não salariais, benefícios, reembolsos e descontos autorizados.

### Etapa B — Classificar cada rubrica

Para cada linha, registre no mínimo:

```text
Nome e natureza jurídica
Valor bruto
Competência(s) a que se refere
Data de pagamento
Base de INSS mensal? (sim/não/específica)
Base de INSS 13º? (sim/não/específica)
Base de IRRF mensal? (sim/não/separada/exclusiva/isenta)
Base de IRRF 13º/PLR/RRA? (sim/não/regime próprio)
Base de FGTS mensal/13º/aviso indenizado? (sim/não/específica)
Valor já pago ou adiantado?
Imposto/contribuição já retido sobre esse grupo?
Fonte legal e condição de eventual isenção
```

### Etapa C — Apurar INSS

1. Some as rubricas com incidência previdenciária na competência mensal.
2. Atribua as férias gozadas às competências correspondentes; não use a data de adiantamento para criar outra base.
3. Considere outros vínculos e contribuições já retidas conforme as regras aplicáveis.
4. Limite a base mensal ao teto de R$ 8.475,55 e aplique a tabela progressiva de 2026.
5. Calcule o INSS de 13º em uma apuração independente.
6. Compare o resultado com a rubrica de desconto previdenciário do empregado. Não some o INSS patronal nem o FGTS ao desconto do empregado.

### Etapa D — Apurar IRRF por grupo legal

Faça contas separadas quando a lei exigir:

- remuneração mensal normal;
- pagamento de férias;
- 13º salário;
- PLR;
- RRA e outras categorias com regra específica.

Para cada conta, aplique somente as bases e deduções cabíveis, a tabela correta, as reduções aplicáveis e os créditos de retenção anterior. Em pagamentos mensais comuns da mesma fonte, consolide os pagamentos que a lei manda somar e compense o imposto já retido. Não use o recibo separado como justificativa para não consolidar pagamentos comuns; também não misture categorias cuja lei manda calcular em separado.

### Etapa E — Apurar FGTS

Some as rubricas de FGTS da competência e aplique a regra/percentual aplicável. Trate 13º, férias gozadas e aviso indenizado conforme as incidências próprias. Mantenha o FGTS fora dos descontos do empregado, salvo se o demonstrativo estiver exibindo apenas informação e não valor de líquido.

### Etapa F — Reconciliar o líquido

Use esta identidade conceitual:

```text
Líquido ainda devido no pagamento atual
= créditos em dinheiro devidos no fechamento
− descontos de INSS do empregado devidos neste fechamento
− IRRF que ainda deve ser retido neste fechamento
− adiantamentos líquidos/brutos já entregues, conforme a contabilização da folha
− demais descontos autorizados e efetivamente devidos
+ ajustes/créditos de reconciliação legítimos
```

A identidade deve ser aplicada de forma consistente com a contabilidade do sistema de folha. Se o adiantamento aparece como um débito pelo valor bruto, os tributos já retidos no momento do adiantamento não devem ser cobrados novamente; o sistema precisa conciliar o valor bruto antecipado e a retenção anterior para que o total líquido recebido no conjunto dos pagamentos seja coerente.

### Etapa G — Conferir o ano e a declaração anual

Não conclua que a retenção mensal esgota o imposto de renda final. Salários e férias — embora as férias sejam calculadas em separado para IRRF na fonte — entram juntos no ajuste anual quando são rendimentos tributáveis sujeitos ao ajuste anual. Já o 13º e a PLR válida são normalmente tributados exclusivamente na fonte e seguem regras próprias. A declaração anual pode resultar em imposto adicional ou restituição por diferenças entre retenções e imposto anual efetivamente devido.

---

## 12. Tabela anual de IRPF aplicável ao ano-calendário de 2026

Como o tratamento do IRRF na fonte nem sempre é igual ao resultado definitivo anual, a tabela anual de 2026 é relevante para conferir o ajuste do ano-calendário de 2026 (declaração entregue em 2027). A Receita Federal publicou os seguintes valores em [Tributação de 2026](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026):

| Base de cálculo anual | Alíquota | Parcela a deduzir |
|---|---:|---:|
| Até R$ 29.145,60 | 0% | R$ 0,00 |
| De R$ 29.145,61 a R$ 33.919,80 | 7,5% | R$ 2.185,92 |
| De R$ 33.919,81 a R$ 45.012,60 | 15% | R$ 4.729,91 |
| De R$ 45.012,61 a R$ 55.976,16 | 22,5% | R$ 8.105,85 |
| Acima de R$ 55.976,16 | 27,5% | R$ 10.904,66 |

Parâmetros anuais publicados:

| Item | Valor |
|---|---:|
| Dedução anual por dependente | R$ 2.275,08 |
| Limite anual de despesas com instrução | R$ 3.561,50 |
| Limite do desconto simplificado anual | R$ 17.640,00 |

### Redução anual de IR — ano-calendário 2026

| Rendimentos tributáveis sujeitos ao ajuste anual | Redução do imposto |
|---|---|
| Até R$ 60.000,00 | Redução limitada ao imposto calculado, de modo que o imposto devido seja zero |
| De R$ 60.000,01 a R$ 88.200,00 | `R$ 8.429,73 − (0,095575 × rendimentos tributáveis sujeitos ao ajuste anual)` |
| A partir de R$ 88.200,00 | Sem essa redução |

O 13º e a PLR corretamente tratados como tributação exclusiva não devem ser somados automaticamente à base tributável anual comum. As férias tributáveis, porém, são reunidas aos demais rendimentos sujeitos ao ajuste anual, embora seu IRRF tenha sido calculado em separado no pagamento.

---

## 13. Checklist final para auditar um holerite

- [ ] Os valores foram classificados pela natureza jurídica, e não apenas pelo nome da rubrica?
- [ ] As bases de INSS, IRRF e FGTS foram calculadas separadamente?
- [ ] Foi usada a tabela de INSS vigente na competência e respeitado o teto?
- [ ] O 13º foi apurado separadamente do salário mensal?
- [ ] As férias gozadas foram alocadas às competências corretas, incluindo o terço constitucional?
- [ ] A remuneração bruta das férias incluiu as médias de horas extras e outros adicionais/variáveis que legalmente integrem a base, calculadas pelo método correto e sem duplicar DSR?
- [ ] O IRRF de férias foi calculado separadamente, no pagamento, e não foi retido novamente na folha de fechamento?
- [ ] Os pagamentos mensais comuns da mesma fonte pagadora foram consolidados quando a regra de IRRF exige isso?
- [ ] A redução de IR de 2026 foi aplicada depois da tabela, com a renda relevante e limite corretos?
- [ ] A PLR, se houver, atende de fato à Lei nº 10.101/2000 e foi calculada pela tabela específica?
- [ ] O salário-família foi avaliado com base na remuneração mensal relevante, sem confundir benefício com verba tributável?
- [ ] Adiantamentos foram abatidos para reconciliar caixa, sem apagar bases tributáveis ou duplicar descontos?
- [ ] O FGTS e encargos patronais não foram subtraídos indevidamente do líquido do empregado?
- [ ] Os descontos voluntários foram mantidos fora das bases fiscais, exceto quando existe autorização legal expressa?
- [ ] As verbas rescisórias, os afastamentos e os reembolsos especiais foram classificados uma a uma?
- [ ] O IRRF retido foi tratado como antecipação, sem confundir a retenção mensal com o imposto final do ajuste anual?

---

## 14. Fontes oficiais e legislação de referência

1. **INSS — Tabela de contribuição mensal 2026:** https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal
2. **INSS — Valor limite e cota do salário-família:** https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-familia/valor-limite-para-direito-ao-salario-familia
3. **Receita Federal — Tabelas do IRPF 2026, mensal, anual, redução e PLR:** https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026
4. **Receita Federal — Exemplos da redução criada pela Lei nº 15.270/2025:** https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/exemplos-de-aplicacao-da-lei-15-270-2025
5. **Lei nº 15.270/2025 — redução mensal, anual e 13º:** https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm
6. **IN RFB nº 1.500/2014 — cálculo de IRRF e férias (art. 29), 13º, PLR e deduções:** https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=57670&visao=anotado
7. **Lei nº 8.212/1991 — salário de contribuição e exclusões previdenciárias:** https://www.planalto.gov.br/ccivil_03/leis/l8212compilado.htm
8. **Receita Federal — tabela de incidência de contribuições previdenciárias por verba:** https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/pagamentos-e-parcelamentos/emissao-e-pagamento-de-darf-das-gps-e-dae/calculo-de-contribuicoes-previdenciarias-e-emissao-de-gps/tabela-de-incidencia-de-contribuicao
9. **eSocial — tabelas de natureza e incidência de rubricas, leiautes 2026:** https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-nt-07-2026/tabelas.html
10. **eSocial — perguntas frequentes sobre férias, adiantamentos e 13º:** https://www.gov.br/esocial/pt-br/empregador-domestico/perguntas-frequentes/perguntas-frequentes e https://www.gov.br/esocial/pt-br/empresas/perguntas-frequentes/historico-de-perguntas-frequentes
11. **Lei nº 10.101/2000 — participação nos lucros ou resultados:** https://www.planalto.gov.br/ccivil_03/leis/l10101.htm
12. **CLT — arts. 142, 143, 145 e 457, entre outros:** https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm
13. **TST — Súmula 347 (média física de horas extras para reflexos):** https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf?version=1.13
14. **Ministério do Trabalho e Emprego — Perguntas frequentes do FGTS Digital (competência de férias):** https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/perguntas-frequentes

**Como manter este manual atualizado:** antes de usá-lo em competência de ano posterior, confirme novamente a tabela do INSS, o teto previdenciário, a tabela mensal/anual do IRPF, a redução de IR, as faixas da PLR e o limite do salário-família. Os valores tabelados são temporais; as fórmulas e a classificação jurídica também devem ser revistas diante de novas leis, instruções normativas, decisões judiciais e versões das tabelas do eSocial.
