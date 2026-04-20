param(
  [int]$Port = 8080,
  [string]$HostName = "localhost",
  [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRootFull = [System.IO.Path]::GetFullPath($projectRoot)
$prefix = "http://${HostName}:$Port/"

$mimeTypes = @{
  ".css" = "text/css; charset=utf-8"
  ".gif" = "image/gif"
  ".html" = "text/html; charset=utf-8"
  ".ico" = "image/x-icon"
  ".jpeg" = "image/jpeg"
  ".jpg" = "image/jpeg"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".map" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".svg" = "image/svg+xml"
  ".txt" = "text/plain; charset=utf-8"
  ".webp" = "image/webp"
  ".woff" = "font/woff"
  ".woff2" = "font/woff2"
}

function Send-TextResponse {
  param(
    [System.Net.HttpListenerResponse]$Response,
    [int]$StatusCode,
    [string]$Body
  )

  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
  $Response.StatusCode = $StatusCode
  $Response.ContentType = "text/plain; charset=utf-8"
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Resolve-RequestPath {
  param([string]$AbsolutePath)

  $relativePath = [System.Uri]::UnescapeDataString($AbsolutePath.TrimStart("/")) -replace "/", "\"

  if ([string]::IsNullOrWhiteSpace($relativePath)) {
    $relativePath = "index.html"
  }

  $candidate = Join-Path $projectRootFull $relativePath
  $fullPath = [System.IO.Path]::GetFullPath($candidate)

  if (-not $fullPath.StartsWith($projectRootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path outside project root."
  }

  if (Test-Path -LiteralPath $fullPath -PathType Container) {
    $fullPath = Join-Path $fullPath "index.html"
  }

  return $fullPath
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host ""
Write-Host "Servidor local ativo em $prefix"
Write-Host "Raiz: $projectRootFull"
Write-Host "Pressione Ctrl+C para encerrar."

if ($OpenBrowser) {
  Start-Process $prefix | Out-Null
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response

    try {
      $filePath = Resolve-RequestPath -AbsolutePath $context.Request.Url.AbsolutePath

      if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        Send-TextResponse -Response $response -StatusCode 404 -Body "404 - Arquivo nao encontrado."
        continue
      }

      $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
      $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($filePath)

      $response.StatusCode = 200
      $response.ContentType = $contentType
      $response.ContentLength64 = $bytes.Length
      $response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
      $response.Headers["Pragma"] = "no-cache"
      $response.Headers["Expires"] = "0"

      if ($context.Request.HttpMethod -ne "HEAD") {
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    }
    catch {
      if (-not $response.OutputStream.CanWrite) {
        continue
      }

      $status = if ($_.Exception.Message -eq "Path outside project root.") { 403 } else { 500 }
      $message = if ($status -eq 403) { "403 - Acesso negado." } else { "500 - Erro ao servir o arquivo." }
      Send-TextResponse -Response $response -StatusCode $status -Body $message
    }
    finally {
      $response.OutputStream.Close()
    }
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}
