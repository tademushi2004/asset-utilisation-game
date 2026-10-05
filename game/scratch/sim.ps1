$simCount = 1000
$playerWins = 0

for ($s = 0; $s -lt $simCount; $s++) {
    $playerCoins = 1000.0
    $kenCoins = 1000.0
    $rowCoins = 1000.0

    $rowPanicked = $false
    $crashCount = 0

    for ($turn = 1; $turn -le 20; $turn++) {
        # Event
        $event = "NONE"
        $r = Get-Random -Minimum 0.0 -Maximum 1.0
        if ($r -lt 0.10 -and $crashCount -lt 2) {
            $event = "CRASH"
            $crashCount++
        } elseif ($r -lt 0.25) {
            $event = "BOOM"
        } elseif ($r -lt 0.40) {
            $event = "INFLATION"
        }

        # Rates
        $rCash = 0.0
        $rDBond = 0.02 + ((Get-Random -Minimum 0.0 -Maximum 1.0) * 2 - 1) * 0.03
        $rFBond = 0.03 + ((Get-Random -Minimum 0.0 -Maximum 1.0) * 2 - 1) * 0.08
        $rDStock = 0.05 + ((Get-Random -Minimum 0.0 -Maximum 1.0) * 2 - 1) * 0.18
        $rFStock = 0.035 + ((Get-Random -Minimum 0.0 -Maximum 1.0) * 2 - 1) * 0.30 # Tuned

        if ($event -eq "CRASH") {
            $rDStock = -0.20 - (Get-Random -Minimum 0.0 -Maximum 1.0) * 0.20
            $rFStock = -0.40 - (Get-Random -Minimum 0.0 -Maximum 1.0) * 0.20
            $rDBond = 0.05 + (Get-Random -Minimum 0.0 -Maximum 1.0) * 0.10
            $rFBond = -0.05 - (Get-Random -Minimum 0.0 -Maximum 1.0) * 0.10
        } elseif ($event -eq "INFLATION") {
            $rCash -= 0.05
            $rDStock += 0.05
            $rFStock += 0.08
        } elseif ($event -eq "BOOM") {
            $rDStock += 0.10
            $rFStock += 0.15
        }

        # Player equal weight
        $pNew = ($playerCoins * 0.2) * (1 + $rCash) +
                ($playerCoins * 0.2) * (1 + $rDBond) +
                ($playerCoins * 0.2) * (1 + $rFBond) +
                ($playerCoins * 0.2) * (1 + $rDStock) +
                ($playerCoins * 0.2) * (1 + $rFStock)
        $playerCoins = $pNew

        # Ken
        $kenCoins = $kenCoins * (1 + $rFStock)

        # Row
        if ($rowPanicked) {
            $rowCoins = $rowCoins * (1 + $rCash)
            $rowPanicked = $false
        } else {
            $rowCoins = ($rowCoins * 0.45) * (1 + $rCash) +
                        ($rowCoins * 0.33) * (1 + $rDBond) +
                        ($rowCoins * 0.22) * (1 + $rDStock)
        }
        if ($event -eq "CRASH") { $rowPanicked = $true }
    }

    if ($playerCoins -ge $kenCoins -and $playerCoins -ge $rowCoins) {
        $playerWins++
    }
}

$winRate = ($playerWins / $simCount) * 100
Write-Host "Win Rate with FStock 0.035/0.30: $winRate %"
