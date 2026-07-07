import math
import json

# Reimplementação em Python da lógica principal do simulator-core.js (reduzida para outputs essenciais)

def calc_mcmv(renda, dividas, fgts, entrada, clt3anos, ePrimeiroImovel, idade, vinculo, hasDependents,
              mesesObra=36, taxaINCC=0.0055, override_taxaAnual=None):
    # ajustes de renda
    renda_original = renda
    if vinculo == 'mei':
        renda = min(renda, 6750) * 0.80
    elif vinculo == 'autonomo':
        renda = renda * 0.80
    if vinculo != 'clt':
        clt3anos = False

    fatorMargem = 0.30
    if vinculo in ('clt','aposentado'):
        fatorMargem = 0.32
    margem = max(0, (renda * fatorMargem) - dividas)

    # prazos
    n = 420
    prazoMaxIdade = math.floor((80.5 * 12) - (idade * 12))
    n = min(n, max(60, prazoMaxIdade))

    # taxas e tetos
    taxaAnual = 0.0816
    tetoImovel = 600000
    foraDoMCMV = False
    if renda <= 3200:
        taxaAnual = 0.0450 if clt3anos else 0.0500
        tetoImovel = 275000
    elif renda <= 5000:
        taxaAnual = 0.0650 if clt3anos else 0.0700
        tetoImovel = 275000
    elif renda <= 9600:
        taxaAnual = 0.0766 if clt3anos else 0.0816
        tetoImovel = 400000
    elif renda <= 13000:
        taxaAnual = 0.0950 if clt3anos else 0.1000
        tetoImovel = 600000
    else:
        taxaAnual = 0.1099
        tetoImovel = 1500000
        n = min(360, max(60, prazoMaxIdade))
        foraDoMCMV = True

    if override_taxaAnual is not None:
        taxaAnual = override_taxaAnual

    taxaMensal = (1 + taxaAnual) ** (1/12) - 1

    # seguros MIP
    if idade <= 30:
        taxaMIP = 0.00015
    elif idade <= 40:
        taxaMIP = 0.00025
    elif idade <= 50:
        taxaMIP = 0.00045
    elif idade <= 60:
        taxaMIP = 0.00080
    elif idade <= 70:
        taxaMIP = 0.00150
    else:
        taxaMIP = 0.00250
    taxaDFI = 0.000034

    potencialBruto = 0
    if n > 0 and ((1/n) + taxaMensal) > 0:
        potencialBruto = math.floor(margem / ((1 / n) + taxaMensal))
    custoMIP = potencialBruto * taxaMIP
    custoDFI = tetoImovel * taxaDFI
    margemLiquida = max(0, margem - custoMIP - custoDFI)
    potencial = 0
    if n > 0 and ((1/n) + taxaMensal) > 0:
        potencial = math.floor(margemLiquida / ((1 / n) + taxaMensal))

    subsidio = 0
    if renda > 0 and renda <= 5000 and ePrimeiroImovel:
        if renda <= 3200:
            baseSubsidio = 55000 - (renda - 1512) * 12
            subsidio = min(55000, max(20000, baseSubsidio))
        else:
            baseSubsidio = 34744 - (renda - 3200) * (34744 / 1800)
            subsidio = round(max(0, baseSubsidio))
        if hasDependents:
            subsidio = min(55000, subsidio * 1.10)
        if renda <= 4863:
            subsidio += 16000

    potencialEfetivo = potencial
    poderEstimado = potencialEfetivo + (fgts or 0) + (entrada or 0) + subsidio

    margemMaximaSegura = max(0, (renda * 0.35) - dividas)
    # folego mensal rely on margemLiquida
    folgaMensal = max(0, margemMaximaSegura - margemLiquida)
    folegoObra = min(60000, folgaMensal * 36)
    poderEstimado += folegoObra

    poderReal = math.floor(poderEstimado / 1000) * 1000
    poderMCMV = min(tetoImovel, poderReal)
    excedeTeto = (poderReal > tetoImovel) and (not foraDoMCMV)

    # parcela entrada (parcelamento construtora)
    valorImovel = poderMCMV
    entradaMinima = valorImovel * 0.20
    recursosProprios = (fgts or 0) + (entrada or 0)
    saldoEntrada = max(0, entradaMinima - recursosProprios)
    taxaINCC = taxaINCC
    saldoMensais = saldoEntrada * 0.35
    parcelaEntrada = 0
    try:
        if saldoMensais == 0:
            parcelaEntrada = 0
        else:
            parcelaEntrada = (saldoMensais * taxaINCC) / (1 - (1 + taxaINCC) ** (-mesesObra))
    except Exception:
        parcelaEntrada = 0

    # financiamento pós-chaves
    taxaEfetiva = 0.1099 if (foraDoMCMV or excedeTeto) else taxaAnual
    taxaMensalEfetiva = (1 + taxaEfetiva) ** (1/12) - 1
    nEfetivo = 360 if (foraDoMCMV or excedeTeto) else n
    subsidioEfetivo = 0 if (foraDoMCMV or excedeTeto) else subsidio

    saldoFinanciado = 0
    try:
        saldoFinanciado = min(potencialEfetivo, max(0, valorImovel - recursosProprios - subsidioEfetivo))
    except Exception:
        saldoFinanciado = 0
    amortizacao = saldoFinanciado / nEfetivo if nEfetivo > 0 else 0
    jurosInicial = saldoFinanciado * taxaMensalEfetiva
    parcelaPeloBanco = max(0, amortizacao + jurosInicial)

    return {
        'margem': round(margem),
        'potencial': round(potencial),
        'subsidio': round(subsidio),
        'poder': round(poderMCMV),
        'poderReal': round(poderReal),
        'tetoMCMV': tetoImovel,
        'excedeTeto': excedeTeto,
        'faixaMCMV': None,
        'taxaAnual': taxaAnual,
        'mesesObra': mesesObra,
        'taxaINCC': taxaINCC,
        'parcelaEntrada': round(parcelaEntrada),
        'parcelaPosChaves': round(parcelaPeloBanco),
        'saldoEntrada': round(saldoEntrada),
        'fgts': fgts,
        'entrada': entrada,
        'rendaOriginal': renda_original,
        'idade': idade,
    }


# Função para rodar sensibilidade

def run_sensitivity():
    base = dict(renda=5000, dividas=500, fgts=20000, entrada=10000,
                clt3anos=True, ePrimeiroImovel=True, idade=35, vinculo='clt', hasDependents=False)

    baseline = calc_mcmv(**base)

    scenarios = []

    # Variação INCC
    incc_vals = [0.004, 0.0055, 0.008]
    for v in incc_vals:
        s = calc_mcmv(**base, mesesObra=36, taxaINCC=v)
        scenarios.append(('INCC', v, s))

    # Variação mesesObra
    for m in [24, 36, 48]:
        s = calc_mcmv(**base, mesesObra=m, taxaINCC=0.0055)
        scenarios.append(('mesesObra', m, s))

    # Variação taxaAnual (simular aumento de mercado +/- 1%)
    # baseline taxaAnual is determined by renda; override with +/- 0.01
    baseline_tax = baseline['poder'] and None
    for delta in [-0.01, 0.0, 0.01]:
        override = None
        # compute current taxaAnual from calc for base
        # call calc to get actual taxaAnual
        tmp = calc_mcmv(**base)
        current_tax = tmp['taxaAnual']
        override = current_tax + delta
        s = calc_mcmv(**base, override_taxaAnual=override)
        scenarios.append(('taxaAnual', round(override,4), s))

    # Compare results with baseline
    results = []
    for kind, param, s in scenarios:
        poder_change_abs = s['poder'] - baseline['poder']
        poder_change_pct = (poder_change_abs / baseline['poder'] * 100) if baseline['poder']!=0 else None
        parcela_change_abs = s['parcelaPosChaves'] - baseline['parcelaPosChaves']
        parcela_change_pct = (parcela_change_abs / baseline['parcelaPosChaves'] * 100) if baseline['parcelaPosChaves']!=0 else None
        results.append({
            'kind': kind,
            'param': param,
            'poder': s['poder'],
            'poder_change_abs': poder_change_abs,
            'poder_change_pct': poder_change_pct,
            'parcela': s['parcelaPosChaves'],
            'parcela_change_abs': parcela_change_abs,
            'parcela_change_pct': parcela_change_pct,
        })

    output = {
        'baseline': baseline,
        'scenarios': results
    }
    print(json.dumps(output, indent=2))


if __name__ == '__main__':
    run_sensitivity()
