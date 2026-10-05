# --- Parameters ---
$INITIAL_COINS = 100
$MAX_TURNS = 20

# Rates base and risk (from game.ts)
$ASSETS = @(
    @{ id='cash'; base=0.00; risk=0.00 },
    @{ id='domestic_bond'; base=0.05; risk=0.03 },
    @{ id='foreign_bond'; base=0.06; risk=0.08 },
    @{ id='domestic_stock'; base=0.08; risk=0.18 },
    @{ id='foreign_stock'; base=0.03; risk=0.40 }
)

$EVENT_PROBABILITIES = @{
    CRASH = 0.05
    INFLATION = 0.10
    BOOM = 0.05
}

function Get-RandomDouble {
    return [Math]::Round((Get-Random -Maximum 1000) / 1000.0, 4)
}

function GenerateRates($eventType) {
    $rates = @{}
    foreach ($a in $ASSETS) {
        $rand = Get-RandomDouble
        $rate = $a.base + ($rand * 2 - 1) * $a.risk
        if ($eventType -eq 'CRASH') {
            if ($a.id -match 'stock') { $rate -= 0.3 }
            elseif ($a.id -match 'bond') { $rate += 0.05 }
            else { $rate += 0.02 }
        } elseif ($eventType -eq 'INFLATION') {
            if ($a.id -eq 'cash') { $rate -= 0.05 }
            elseif ($a.id -match 'stock') { $rate += 0.1 }
        } elseif ($eventType -eq 'BOOM') {
            if ($a.id -match 'stock') { $rate += 0.2 }
            else { $rate -= 0.02 }
        }
        $rates[$a.id] = $rate
    }
    return $rates
}

function CheckLifeEvent($cash, $turn) {
    if ($turn -le 1) { return 0 }
    if ((Get-RandomDouble) -gt 0.20) { return 0 }
    
    $costs = @(8, 10, 12, 6, 5)
    $cost = $costs | Get-Random
    if ($cash -ge $cost) { return $cost }
    return -1
}

# Run
$N = 1000
$playerWins = 0
$kenWins = 0
$cameoWins = 0
$rowWins = 0
$lanWins = 0
$daveWins = 0
$bankruptcies = 0

for ($i=0; $i -lt $N; $i++) {
    $pCoins = $INITIAL_COINS
    $kCoins = $INITIAL_COINS
    $cCoins = $INITIAL_COINS
    $rCoins = $INITIAL_COINS
    $lCoins = $INITIAL_COINS
    $dCoins = $INITIAL_COINS
    
    $rPanicked = $false
    $lastRates = $null
    
    $isBankrupt = $false
    
    for ($t=1; $t -le $MAX_TURNS; $t++) {
        $rand = Get-RandomDouble
        $event = $null
        if ($rand -lt 0.05) { $event = 'CRASH' }
        elseif ($rand -lt 0.15) { $event = 'INFLATION' }
        elseif ($rand -lt 0.20) { $event = 'BOOM' }
        
        $rates = GenerateRates($event)
        
        # Player (Royal)
        $avg = [Math]::Floor($pCoins / 5)
        $pAlloc = @{
            cash=$avg; domestic_bond=$avg; foreign_bond=$avg;
            domestic_stock=$avg; foreign_stock=($pCoins - $avg*4)
        }
        $penalty = CheckLifeEvent $pAlloc.cash $t
        
        $nP = 0
        foreach ($k in $pAlloc.Keys) {
            $nP += $pAlloc[$k] * (1 + $rates[$k])
        }
        $nP = [Math]::Round($nP)
        
        if ($penalty -eq -1) {
            $nP = $nP - ([Math]::Round($nP * 0.50) + 30)
        } else {
            $nP -= $penalty
        }
        if ($nP -le 0) { $isBankrupt = $true; break }
        $pCoins = $nP
        
        # Ken
        $kCoins = [Math]::Round($kCoins * (1 + $rates.foreign_stock))
        
        # Cameo
        $cCoins = [Math]::Round($cCoins * (1 + $rates.cash))
        
        # Row
        if ($event -eq 'CRASH') {
            $rCoins = [Math]::Round($rCoins * (1 + $rates.cash))
            $rPanicked = $true
        } else {
            $cashP = [Math]::Round($rCoins * (0.3 + (Get-RandomDouble)*0.3))
            $rem = $rCoins - $cashP
            $bondP = [Math]::Round($rem * 0.6)
            $stockP = $rem - $bondP
            
            $nR = $cashP * (1 + $rates.cash) + $bondP * (1 + $rates.domestic_bond) + $stockP * (1 + $rates.domestic_stock)
            $rCoins = [Math]::Round($nR)
        }
        
        # Lan
        $w1 = Get-RandomDouble; $w2 = Get-RandomDouble; $w3 = Get-RandomDouble; $w4 = Get-RandomDouble; $w5 = Get-RandomDouble
        $tw = $w1+$w2+$w3+$w4+$w5
        $a1 = [Math]::Floor($lCoins * ($w1/$tw)); $a2 = [Math]::Floor($lCoins * ($w2/$tw))
        $a3 = [Math]::Floor($lCoins * ($w3/$tw)); $a4 = [Math]::Floor($lCoins * ($w4/$tw))
        $a5 = $lCoins - ($a1+$a2+$a3+$a4)
        $nL = $a1*(1+$rates.cash) + $a2*(1+$rates.domestic_bond) + $a3*(1+$rates.foreign_bond) + $a4*(1+$rates.domestic_stock) + $a5*(1+$rates.foreign_stock)
        $lCoins = [Math]::Round($nL)
        
        # Dave
        if ($lastRates -eq $null) {
            $avgD = [Math]::Floor($dCoins / 5)
            $a1 = $avgD; $a2 = $avgD; $a3 = $avgD; $a4 = $avgD; $a5 = $dCoins - $avgD*4
        } else {
            $w1 = [Math]::Max(0, 100 + $lastRates.cash*100); $w2 = [Math]::Max(0, 100 + $lastRates.domestic_bond*100)
            $w3 = [Math]::Max(0, 100 + $lastRates.foreign_bond*100); $w4 = [Math]::Max(0, 100 + $lastRates.domestic_stock*100)
            $w5 = [Math]::Max(0, 100 + $lastRates.foreign_stock*100)
            $tw = $w1+$w2+$w3+$w4+$w5
            $a1 = [Math]::Floor($dCoins * ($w1/$tw)); $a2 = [Math]::Floor($dCoins * ($w2/$tw))
            $a3 = [Math]::Floor($dCoins * ($w3/$tw)); $a4 = [Math]::Floor($dCoins * ($w4/$tw))
            $a5 = $dCoins - ($a1+$a2+$a3+$a4)
        }
        $nD = $a1*(1+$rates.cash) + $a2*(1+$rates.domestic_bond) + $a3*(1+$rates.foreign_bond) + $a4*(1+$rates.domestic_stock) + $a5*(1+$rates.foreign_stock)
        $dCoins = [Math]::Round($nD)
        
        $lastRates = $rates
    }
    
    if ($isBankrupt) { $bankruptcies++; continue }
    
    $max = $pCoins
    $winner = 'Player'
    if ($kCoins -gt $max) { $max = $kCoins; $winner = 'Ken' }
    if ($cCoins -gt $max) { $max = $cCoins; $winner = 'Cameo' }
    if ($rCoins -gt $max) { $max = $rCoins; $winner = 'Row' }
    if ($lCoins -gt $max) { $max = $lCoins; $winner = 'Lan' }
    if ($dCoins -gt $max) { $max = $dCoins; $winner = 'Dave' }
    
    if ($winner -eq 'Player') { $playerWins++ }
    elseif ($winner -eq 'Ken') { $kenWins++ }
    elseif ($winner -eq 'Cameo') { $cameoWins++ }
    elseif ($winner -eq 'Row') { $rowWins++ }
    elseif ($winner -eq 'Lan') { $lanWins++ }
    elseif ($winner -eq 'Dave') { $daveWins++ }
}

Write-Host "Runs: $N"
$pRate = [Math]::Round($playerWins / $N * 100, 1)
$bRate = [Math]::Round($bankruptcies / $N * 100, 1)
$kRate = [Math]::Round($kenWins / $N * 100, 1)
$cRate = [Math]::Round($cameoWins / $N * 100, 1)
$rRate = [Math]::Round($rowWins / $N * 100, 1)
$lRate = [Math]::Round($lanWins / $N * 100, 1)
$dRate = [Math]::Round($daveWins / $N * 100, 1)

Write-Host "Player: $pRate %"
Write-Host "Bankrupt: $bRate %"
Write-Host "Ken: $kRate %"
Write-Host "Cameo: $cRate %"
Write-Host "Row: $rRate %"
Write-Host "Lan: $lRate %"
Write-Host "Dave: $dRate %"
