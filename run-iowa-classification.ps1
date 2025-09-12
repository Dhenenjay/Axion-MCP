# Iowa Crop Classification Script

Write-Host "Iowa Crop Classification with Ground Truth Data" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Read the JavaScript code
$classificationCode = Get-Content -Path "iowa-crop-classification-complete.js" -Raw

Write-Host "Executing crop classification model..." -ForegroundColor Yellow

# Execute the classification code
try {
    $systemResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/mcp/consolidated" -Method Post -ContentType "application/json" -Body (@{
        tool = "earth_engine_system"
        arguments = @{
            operation = "execute"
            code = $classificationCode
            language = "javascript"
        }
    } | ConvertTo-Json -Depth 10)

    Write-Host "Classification executed successfully" -ForegroundColor Cyan
    $systemResponse | ConvertTo-Json -Depth 10

    # Check if an image key was returned
    if ($systemResponse.imageKey) {
        $imageKey = $systemResponse.imageKey
        Write-Host "Image stored with key: $imageKey" -ForegroundColor Green
        
        Write-Host "Generating crop classification thumbnail..." -ForegroundColor Yellow
        
        # Generate thumbnail
        $thumbnailResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/mcp/consolidated" -Method Post -ContentType "application/json" -Body (@{
            tool = "earth_engine_export"
            arguments = @{
                operation = "thumbnail"
                input = $imageKey
                dimensions = 768
                region = "Iowa"
                visParams = @{
                    bands = @("crop_classification")
                    min = 1
                    max = 6
                    palette = @(
                        "#FFD700",
                        "#32CD32",
                        "#DEB887",
                        "#9370DB",
                        "#90EE90",
                        "#A0522D"
                    )
                }
            }
        } | ConvertTo-Json -Depth 10)
        
        Write-Host "Thumbnail response received" -ForegroundColor Cyan
        
        if ($thumbnailResponse.url) {
            Write-Host "Thumbnail generated successfully!" -ForegroundColor Green
            Write-Host "Thumbnail URL: $($thumbnailResponse.url)" -ForegroundColor Cyan
            
            # Open in browser
            Write-Host "Opening thumbnail in browser..." -ForegroundColor Yellow
            Start-Process $thumbnailResponse.url
            
            # Save URL
            $thumbnailResponse.url | Out-File -FilePath "iowa-classification-thumbnail-url.txt"
            Write-Host "URL saved to iowa-classification-thumbnail-url.txt" -ForegroundColor Gray
        }
        else {
            Write-Host "No thumbnail URL received" -ForegroundColor Red
        }
    }
    else {
        Write-Host "No image key returned from classification" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Classification Legend:" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow
Write-Host "[1] Corn     - Gold" -ForegroundColor Yellow
Write-Host "[2] Soybean  - Green" -ForegroundColor Green
Write-Host "[3] Wheat    - Tan" -ForegroundColor DarkYellow
Write-Host "[4] Alfalfa  - Purple" -ForegroundColor Magenta
Write-Host "[5] Pasture  - Light Green" -ForegroundColor DarkGreen
Write-Host "[6] Fallow   - Brown" -ForegroundColor DarkRed

Write-Host ""
Write-Host "Classification complete!" -ForegroundColor Green