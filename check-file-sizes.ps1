Get-ChildItem -Path "src\features\dashboard" -Recurse -Include *.tsx,*.ts | ForEach-Object {
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    if ($lines -gt 300) {
        [PSCustomObject]@{
            File = $_.Name
            Lines = $lines
        }
    }
} | Sort-Object Lines -Descending | Select-Object -First 30 | Format-Table -AutoSize
