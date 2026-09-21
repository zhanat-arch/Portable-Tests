param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [string]$Label = ''
)

Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Image]::FromFile($InputPath)
$canvas = New-Object System.Drawing.Bitmap 1200, 630
$canvas.SetResolution(96, 96)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$targetRatio = 1200 / 630
$sourceRatio = $source.Width / $source.Height
if ($sourceRatio -gt $targetRatio) {
  $cropHeight = $source.Height
  $cropWidth = [int]($cropHeight * $targetRatio)
  $cropX = [int](($source.Width - $cropWidth) / 2)
  $cropY = 0
} else {
  $cropWidth = $source.Width
  $cropHeight = [int]($cropWidth / $targetRatio)
  $cropX = 0
  $cropY = [int](($source.Height - $cropHeight) / 2)
}

$dest = New-Object System.Drawing.Rectangle 0, 0, 1200, 630
$src = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropWidth, $cropHeight
$graphics.DrawImage($source, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)

if ($Label) {
  $font = New-Object System.Drawing.Font 'Segoe UI', 42, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $measure = $graphics.MeasureString($Label, $font)
  $box = New-Object System.Drawing.RectangleF 52, 518, ($measure.Width + 46), 72
  $background = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(188, 12, 7, 35))
  $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $graphics.FillRectangle($background, $box)
  $graphics.DrawString($Label, $font, $textBrush, 75, 527)
  $font.Dispose()
  $background.Dispose()
  $textBrush.Dispose()
}

$directory = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $directory)) {
  New-Item -ItemType Directory -Path $directory | Out-Null
}
$extension = [System.IO.Path]::GetExtension($OutputPath).ToLowerInvariant()
if ($extension -eq '.jpg' -or $extension -eq '.jpeg') {
  $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
  $quality = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 90L
  $parameters = New-Object System.Drawing.Imaging.EncoderParameters 1
  $parameters.Param[0] = $quality
  $canvas.Save($OutputPath, $encoder, $parameters)
  $quality.Dispose()
  $parameters.Dispose()
} else {
  $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}

$graphics.Dispose()
$canvas.Dispose()
$source.Dispose()
