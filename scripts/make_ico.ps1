param(
    [string]$SourcePath,
    [string]$OutputPath
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile($SourcePath)
$sizes = @(256, 128, 64, 48, 32, 16)
$imagesData = @()

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $ms.ToArray()
    $ms.Dispose()
    $bmp.Dispose()

    $imagesData += ,@($size, $pngBytes)
}
$src.Dispose()

$fs = [System.IO.File]::Create($OutputPath)
$bw = New-Object System.IO.BinaryWriter $fs

# ICONDIR header (6 bytes)
$bw.Write([uint16]0) # Reserved
$bw.Write([uint16]1) # Type: 1 = ICO
$bw.Write([uint16]$imagesData.Count) # Number of images

# Offset calculation: header is 6 bytes + (16 * count)
$offset = 6 + (16 * $imagesData.Count)

foreach ($item in $imagesData) {
    $size = $item[0]
    $data = $item[1]
    
    $w = if ($size -ge 256) { [byte]0 } else { [byte]$size }
    $h = if ($size -ge 256) { [byte]0 } else { [byte]$size }
    $bw.Write([byte]$w)
    $bw.Write([byte]$h)
    $bw.Write([byte]0) # Color count
    $bw.Write([byte]0) # Reserved
    $bw.Write([uint16]1) # Color planes
    $bw.Write([uint16]32) # Bits per pixel
    $bw.Write([uint32]$data.Length) # Image data size
    $bw.Write([uint32]$offset) # Image data offset
    $offset += $data.Length
}

foreach ($item in $imagesData) {
    $data = $item[1]
    $bw.Write($data)
}

$bw.Flush()
$bw.Close()
$fs.Close()
Write-Host "Generated $OutputPath with $($imagesData.Count) resolutions."
