# --- Parameters ---
$INITIAL_COINS = 100
$MAX_TURNS = 20

# Updated Rates base and risk (from game.ts plan)
$ASSETS = @(
    @{ id='cash'; base=0.00; risk=0.00 },
    @{ id='domestic_bond'; base=0.05; risk=0.03 },
    @{ id='foreign_bond'; base=0.07; risk=0.08 },
    @{ id='domestic_stock'; base=0.08; risk=0.18 },
    @{ id='foreign_stock'; base=0.06; risk=0.40 }
)

function Get-RandomDouble {
    return [Math]::Round((Get-Random -Maximum 1000) / 1000.0, 4)
}

function GenerateRates($eventType) {
    $rates = @{}
    foreach ($a in $ASSETS) {
        $rand = Get-RandomDouble
        $rate = $a.base + ($rand * 2 - 1) * $a.risk
        if ($eventType -eq 'CRASH') {
            if ($a.id -match 'stock') { $rate = -0.25 - (Get-RandomDouble)*0.20 } # -25% to -45%
        } elseif ($eventType -eq 'INFLATION') {
            if ($a.id -eq 'cash') { $rate = -0.05 }
        } elseif ($eventType -eq 'BOOM') {
            if ($a.id -match 'stock') { $rate += 0.12 } # +12% boom
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
    if ($cash -ge $cost) { return 0 } # No penalty if you have enough cash
    return -1
}

# Run
$N = 1000
$royalWins = 0
$optWins = 0
$kenWins = 0
$daveWins = 0

$royalTotalCoins = 0
$optTotalCoins = 0

$royalBankrupt = 0
$optBankrupt = 0

for ($i=0; $i -lt $N; $i++) {
    $royalCoins = $INITIAL_COINS
    $optCoins = $INITIAL_COINS
    $kCoins = $INITIAL_COINS
    $dCoins = $INITIAL_COINS
    
    $lastRates = $null
    
    $royalIsBankrupt = $false
    $optIsBankrupt = $false
    
    for ($t=1; $t -le $MAX_TURNS; $t++) {
        $rand = Get-RandomDouble
        $event = $null
        if ($rand -lt 0.05) { $event = 'CRASH' }
        elseif ($rand -lt 0.15) { $event = 'INFLATION' }
        elseif ($rand -lt 0.20) { $event = 'BOOM' }
        
        $rates = GenerateRates($event)
        
        # --- Royal (20% each) ---
        if (-not $royalIsBankrupt) {
            $avg = [Math]::Floor($royalCoins / 5)
            $rAlloc = @{
                cash=$avg; domestic_bond=$avg; foreign_bond=$avg;
                domestic_stock=$avg; foreign_stock=($royalCoins - $avg*4)
            }
            $penR = CheckLifeEvent $rAlloc.cash $t
            $nR = 0
            foreach ($k in $rAlloc.Keys) { $nR += $rAlloc[$k] * (1 + $rates[$k]) }
            $nR = [Math]::Round($nR)
            if ($penR -eq -1) { $nR = $nR - ([Math]::Round($nR * 0.50) + 30) }
            if ($nR -le 0) { $royalIsBankrupt = $true; $royalCoins = 0 } else { $royalCoins = $nR }
        }
        
        # --- Optimized (Cash fixed 30, rest 4-way split) ---
        if (-not $optIsBankrupt) {
            $cashAmt = [Math]::Min(30, $optCoins)
            $rem = $optCoins - $cashAmt
            $avgOpt = [Math]::Floor($rem / 4)
            $oAlloc = @{
                cash=$cashAmt; domestic_bond=$avgOpt; foreign_bond=$avgOpt;
                domestic_stock=$avgOpt; foreign_stock=($rem - $avgOpt*3)
            }
            $penO = CheckLifeEvent $oAlloc.cash $t
            $nO = 0
            foreach ($k in $oAlloc.Keys) { $nO += $oAlloc[$k] * (1 + $rates[$k]) }
            $nO = [Math]::Round($nO)
            if ($penO -eq -1) { $nO = $nO - ([Math]::Round($nO * 0.50) + 30) }
            if ($nO -le 0) { $optIsBankrupt = $true; $optCoins = 0 } else { $optCoins = $nO }
        }
        
        # --- Ken (100% Foreign Stock) ---
        $kCoins = [Math]::Round($kCoins * (1 + $rates.foreign_stock))
        
        # --- Dave (Momentum) ---
        if ($lastRates -eq $null) {
            $avgD = [Math]::Floor($dCoins / 5)
            $a1=$avgD; $a2=$avgD; $a3=$avgD; $a4=$avgD; $a5=$dCoins - $avgD*4
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
    
    $royalTotalCoins += $royalCoins
    $optTotalCoins += $optCoins
    if ($royalIsBankrupt) { $royalBankrupt++ }
    if ($optIsBankrupt) { $optBankrupt++ }
    
    # Check winners (Simulate a match with Royal vs CPUs, and Opt vs CPUs)
    # Match 1: Royal vs Ken vs Dave
    $max1 = $royalCoins; $win1 = 'Royal'
    if ($kCoins -gt $max1) { $max1 = $kCoins; $win1 = 'Ken' }
    if ($dCoins -gt $max1) { $max1 = $dCoins; $win1 = 'Dave' }
    if ($win1 -eq 'Royal') { $royalWins++ }
    elseif ($win1 -eq 'Ken') { $kenWins++ }
    elseif ($win1 -eq 'Dave') { $daveWins++ }
    
    # Match 2: Opt vs Ken vs Dave (We just count Opt's win rate in this universe)
    $max2 = $optCoins; $win2 = 'Opt'
    if ($kCoins -gt $max2) { $max2 = $kCoins; $win2 = 'Ken' }
    if ($dCoins -gt $max2) { $max2 = $dCoins; $win2 = 'Dave' }
    if ($win2 -eq 'Opt') { $optWins++ }
}

Write-Host "Runs: $N"
Write-Host "--- Averages ---"
$avgRoyal = [Math]::Round($royalTotalCoins / $N)
$avgOpt = [Math]::Round($optTotalCoins / $N)
Write-Host "Royal Final Coins: $avgRoyal"
Write-Host "Opt Final Coins: $avgOpt"
Write-Host ""
Write-Host "--- Win Rates ---"
$rWinRate = [Math]::Round($royalWins / $N * 100, 1)
$oWinRate = [Math]::Round($optWins / $N * 100, 1)
$kWinRate = [Math]::Round($kenWins / $N * 100, 1)
Write-Host "Royal Win Rate: $rWinRate %"
Write-Host "Opt Win Rate: $oWinRate %"
Write-Host "Ken Win Rate: $kWinRate %"
