# Guia de atualização do catálogo de empreendimentos

Este documento resume o fluxo oficial para atualizar o catálogo do site com o mínimo de esforço possível.

## Objetivo

O site lê os dados de um catálogo central gerado a partir da planilha `Empreendimentos.xlsx`. Quando a planilha e as imagens são atualizadas, o sincronizador gera automaticamente o arquivo usado pelo mapa, pelos cards e pelo `dossie.html`.

## Pré-requisitos

- Python 3.x instalado
- Dependência do script: `openpyxl`
- Planilha `Empreendimentos.xlsx` na raiz do projeto
- Pasta de imagens `assets/images/empreendimentos`
- Opcional: arquivo `.env` com `GOOGLE_MAPS_API_KEY` para geocodificação mais precisa

## Fluxo recomendado

1. Abra a planilha `Empreendimentos.xlsx`.
2. Adicione ou atualize os dados do empreendimento.
3. Coloque a imagem correspondente em `assets/images/empreendimentos`.
4. Clique duas vezes em `atualizar_catalogo.bat`.
5. Verifique o resultado no site ou no `dossie.html`.

## Estrutura da planilha

A planilha deve manter esta ordem de colunas:

- A: Nome
- B: Bairro / Região
- C: Endereço completo
- D: Área
- E: Quartos
- F: Diferenciais
- G: Lazer
- H: Preço
- I: Entrega
- J: Nome da imagem

## Regras importantes

- O nome da imagem pode vir com ou sem extensão; o script tenta `.jpg`, `.jpeg` e `.png` automaticamente.
- O endereço deve ser o mais completo possível para melhorar a geocodificação.
- Se a imagem não existir, o item continua no catálogo, mas sem imagem.
- Se a geocodificação falhar, o item continua no catálogo, mas sem coordenadas válidas.
- O campo `uid` é gerado automaticamente para cada empreendimento, sem necessidade de coluna extra na planilha.

## Como executar a sincronização

### Opção 1: um clique no Windows

Dê dois cliques em `atualizar_catalogo.bat`.

### Opção 2: terminal

No diretório do projeto, execute:

```powershell
python scripts/sync_cms.py
```

Para ver uma prévia sem salvar arquivos:

```powershell
python scripts/sync_cms.py --dry-run
```

## O que o `.bat` faz

O `atualizar_catalogo.bat`:

- entra automaticamente na raiz do projeto
- usa `.venv\Scripts\python.exe` se ele existir
- cai para `python` se o ambiente virtual não estiver disponível
- repassa qualquer argumento extra para `scripts\sync_cms.py`
- mostra mensagem de sucesso ou falha ao final

## Arquivos gerados

Ao final da execução, o script pode gerar ou atualizar:

- `empreendimentos.js`
- `coords_cache.json`
- `empreendimentos.js.bkp` como backup do arquivo anterior

O arquivo `empreendimentos.js` passa a incluir `uid` em todos os itens, o que mantém o `dossie.html` funcionando corretamente.

## Configuração opcional de chave do Google Maps

O script tenta usar a API do Google Maps quando existir `GOOGLE_MAPS_API_KEY` no arquivo `.env`.

Se a chave não existir, ele usa o serviço gratuito Nominatim do OpenStreetMap.

Exemplo de configuração:

```env
GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

Crie o arquivo `.env` na raiz do projeto com esse conteúdo se quiser melhorar a precisão da geocodificação.

## Troubleshooting

- Erro de módulo `openpyxl`: instale com `pip install openpyxl`
- Imagem não aparece: verifique se o nome do arquivo corresponde ao valor da coluna J
- Mapa sem pin: confirme se o endereço está correto e se a geocodificação retornou coordenadas válidas
- `dossie.html` não muda de imóvel: confira se o `empreendimentos.js` foi regenerado com `uid` em todos os itens
- Script não executa: confira se você está na pasta do projeto e se o Python está disponível no PATH
