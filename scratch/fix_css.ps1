$filePath = "assets/css/templatemo-villa-agency.css"
$content = Get-Content $filePath -Raw

# Definindo o bloco antigo e o novo bloco
$oldBlock = @'
.contact-content #map {
  border-radius: 10px;
  margin-bottom: 60px;
}

.contact-content .item {
  border-radius: 10px;
  box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.15);
  padding: 35px 30px;
  background-color: #fff;
}

.contact-content .phone {
  margin-right: 15px;
}

.contact-content .email {
  margin-left: 15px;
}

.contact-content .item img {
  float: left;
  margin-right: 25px;
  vertical-align: middle;
}

.contact-content .item h6 {
  font-size: 20px;
  font-weight: 600;
  vertical-align: middle;
}

.contact-content .item h6 span {
  font-size: 15px;
  color: #aaaaaa;
  font-weight: 400;
}
'@

# Normalizando quebras de linha para garantir o match (Windows CRLF)
$oldBlock = $oldBlock -replace "`r`n", "`n"
$contentNormalized = $content -replace "`r`n", "`n"

$newBlock = @'
.contact-content #map {
  border-radius: 10px;
  margin-bottom: 60px;
}

.contact-content .item {
  border-radius: 10px;
  box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.15);
  padding: 35px 30px;
  background-color: #fff;
  display: flex;
  align-items: center;
  margin-bottom: 25px;
}

.contact-content .phone,
.contact-content .email {
  margin-right: 0;
  margin-left: 0;
}

.contact-content .item img {
  width: 52px;
  margin-right: 25px;
  flex-shrink: 0;
}

.contact-content .item h6 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 0;
}

.contact-content .item h6 span {
  font-size: 15px;
  color: #aaaaaa;
  font-weight: 400;
}
'@

if ($contentNormalized.Contains($oldBlock)) {
    $newContent = $contentNormalized.Replace($oldBlock, $newBlock)
    # Voltando para CRLF se necessário (opcional, mas bom manter padrão)
    $newContent = $newContent -replace "`n", "`r`n"
    Set-Content -Path $filePath -Value $newContent -NoNewline
    Write-Output "CSS atualizado com sucesso via script."
} else {
    Write-Error "Não foi possível encontrar o bloco de CSS para substituição."
}
