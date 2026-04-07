$base = "e:\Projetos AntiGrafity\TEOLOGIA GLOBAL\Escola de Teologia\TEO GLOBAL"
$p1 = Get-Content "$base\tmp\store_part1.txt" -Raw
$p2 = Get-Content "$base\tmp\store_part2.txt" -Raw
$p3 = Get-Content "$base\tmp\store_part3.txt" -Raw
$final = $p1 + $p2 + $p3
$final | Set-Content "$base\lib\store.ts" -Encoding UTF8 -Force
