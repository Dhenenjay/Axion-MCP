# Comprehensive Agricultural Classification Tests
Write-Host "`nRunning Agricultural Classification Tests for Multiple Regions" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green

# Store all thumbnail URLs
$thumbnailUrls = @()

# Test regions
$regions = @(
    @{Name="Iowa"; StartDate="2024-04-01"; EndDate="2024-10-31"},
    @{Name="California"; StartDate="2024-03-01"; EndDate="2024-10-31"},
    @{Name="Kansas"; StartDate="2024-04-01"; EndDate="2024-09-30"},
    @{Name="Illinois"; StartDate="2024-04-15"; EndDate="2024-10-15"},
    @{Name="Texas"; StartDate="2024-03-15"; EndDate="2024-10-31"},
    @{Name="North Dakota"; StartDate="2024-05-01"; EndDate="2024-09-30"},
    @{Name="Nebraska"; StartDate="2024-04-01"; EndDate="2024-10-31"},
    @{Name="Minnesota"; StartDate="2024-04-15"; EndDate="2024-10-15"},
    @{Name="Wisconsin"; StartDate="2024-04-15"; EndDate="2024-10-15"},
    @{Name="Indiana"; StartDate="2024-04-01"; EndDate="2024-10-31"}
)

# County-level tests
$counties = @(
    @{Name="Fresno County, California"; StartDate="2024-03-01"; EndDate="2024-10-31"},
    @{Name="McLean County, Illinois"; StartDate="2024-04-15"; EndDate="2024-10-15"}
)

Write-Host "`nTesting State-Level Classifications:" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

$testCount = 1
foreach ($region in $regions) {
    Write-Host "`nTest $testCount`: $($region.Name)" -ForegroundColor Cyan
    
    try {
        # Run agricultural model
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/mcp/consolidated" `
            -Method Post `
            -ContentType "application/json" `
            -Body (@{
                tool = "earth_engine_process"
                arguments = @{
                    operation = "model"
                    modelType = "agriculture"
                    region = $region.Name
                    startDate = $region.StartDate
                    endDate = $region.EndDate
                    scale = 30
                    analysisType = "classification"
                }
            } | ConvertTo-Json -Depth 10)
        
        if ($response.modelKey) {
            Write-Host "  Model created: $($response.modelKey)" -ForegroundColor Gray
            
            # Generate thumbnail
            $thumbResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/mcp/consolidated" `
                -Method Post `
                -ContentType "application/json" `
                -Body (@{
                    tool = "earth_engine_export"
                    arguments = @{
                        operation = "thumbnail"
                        input = $response.modelKey
                        dimensions = 512
                        region = $region.Name
                        visParams = @{
                            bands = @("crop_health")
                            min = 0
                            max = 0.8
                            palette = @("red", "orange", "yellow", "lightgreen", "darkgreen")
                        }
                    }
                } | ConvertTo-Json -Depth 10)
            
            if ($thumbResponse.url) {
                Write-Host "  ✓ Thumbnail generated successfully" -ForegroundColor Green
                $thumbnailUrls += @{
                    Region = $region.Name
                    TestNumber = $testCount
                    URL = $thumbResponse.url
                    ModelKey = $response.modelKey
                }
            } else {
                Write-Host "  ✗ Thumbnail generation failed" -ForegroundColor Red
            }
        } else {
            Write-Host "  ✗ Model creation failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
    }
    
    $testCount++
    
    # Stop at 10 tests
    if ($testCount -gt 10) { break }
}

# Test counties if we haven't reached 10 tests
if ($testCount -le 10) {
    Write-Host "`nTesting County-Level Classifications:" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Yellow
    
    foreach ($county in $counties) {
        if ($testCount -gt 10) { break }
        
        Write-Host "`nTest $testCount`: $($county.Name)" -ForegroundColor Cyan
        
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:3000/api/mcp/consolidated" `
                -Method Post `
                -ContentType "application/json" `
                -Body (@{
                    tool = "earth_engine_process"
                    arguments = @{
                        operation = "model"
                        modelType = "agriculture"
                        region = $county.Name
                        startDate = $county.StartDate
                        endDate = $county.EndDate
                        scale = 30
                    }
                }
            } | ConvertTo-Json -Depth 10)
            
            if ($response.modelKey) {
                Write-Host "  Model created: $($response.modelKey)" -ForegroundColor Gray
                
                $thumbResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/mcp/consolidated" `
                    -Method Post `
                    -ContentType "application/json" `
                    -Body (@{
                        tool = "earth_engine_export"
                        arguments = @{
                            operation = "thumbnail"
                            input = $response.modelKey
                            dimensions = 512
                            region = $county.Name
                            visParams = @{
                                bands = @("crop_health")
                                min = 0
                                max = 0.8
                                palette = @("red", "orange", "yellow", "lightgreen", "darkgreen")
                            }
                        }
                    } | ConvertTo-Json -Depth 10)
                
                if ($thumbResponse.url) {
                    Write-Host "  ✓ Thumbnail generated successfully" -ForegroundColor Green
                    $thumbnailUrls += @{
                        Region = $county.Name
                        TestNumber = $testCount
                        URL = $thumbResponse.url
                        ModelKey = $response.modelKey
                    }
                }
            }
        } catch {
            Write-Host "  ✗ Error: $_" -ForegroundColor Red
        }
        
        $testCount++
    }
}

# Display results
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "CLASSIFICATION TEST RESULTS" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host "`nSuccessful Classifications: $($thumbnailUrls.Count) / $($testCount - 1)" -ForegroundColor Cyan

# Save URLs to file
$reportContent = "Agricultural Classification Test Results`n"
$reportContent += "Generated: $(Get-Date)`n"
$reportContent += "=====================================`n`n"

foreach ($result in $thumbnailUrls) {
    Write-Host "`nTest $($result.TestNumber): $($result.Region)" -ForegroundColor Yellow
    Write-Host "URL: $($result.URL)" -ForegroundColor Gray
    
    $reportContent += "Test $($result.TestNumber): $($result.Region)`n"
    $reportContent += "Model Key: $($result.ModelKey)`n"
    $reportContent += "Thumbnail URL: $($result.URL)`n`n"
}

# Save report
$reportContent | Out-File -FilePath "classification-test-results.txt"
Write-Host "`nResults saved to classification-test-results.txt" -ForegroundColor Green

# Create HTML report with clickable links
$htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Agricultural Classification Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2e7d32; }
        .test { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .test h3 { color: #1976d2; margin-top: 0; }
        a { color: #1976d2; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .thumbnail { max-width: 300px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Agricultural Classification Test Results</h1>
    <p>Generated: $(Get-Date)</p>
"@

foreach ($result in $thumbnailUrls) {
    $htmlContent += @"
    <div class="test">
        <h3>Test $($result.TestNumber): $($result.Region)</h3>
        <p>Model Key: <code>$($result.ModelKey)</code></p>
        <p><a href="$($result.URL)" target="_blank">View Thumbnail</a></p>
        <img class="thumbnail" src="$($result.URL)" alt="$($result.Region) classification">
    </div>
"@
}

$htmlContent += @"
</body>
</html>
"@

$htmlContent | Out-File -FilePath "classification-results.html"
Write-Host "HTML report saved to classification-results.html" -ForegroundColor Green

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "ALL TESTS COMPLETED!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green