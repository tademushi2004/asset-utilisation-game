$simCount = 1000
$playerWins = 0
$kenWins = 0
$rowWins = 0

for ($s = 0; $s -lt $simCount; $s++) {
    $playerCoins = 1000.0
    $kenCoins = 1000.0
    $rowCoins = 1000.0

    $rowPanicked = $false
    $crashCount = 0

    for ($turn = 1; $turn -le 20; $turn++) {
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

        # Boosted parameters for Player's benefit
        $rCash = 0.0
        $rDBond = 0.03 + ((Get-Random -Minimum 0.0 -Maximum 1.0) * 2 - 1) * 0.03 # Was 0.02
        $rFBond = 0.04 + ((Get-Random -Minimum 0.0 -Maximum 1.0) * 2 - 1) * 0.08 # Was 0.03
        $rDStock = 0.06 + ((Get-Random -Minimum 0.0 -Maximum 1.0) * 2 - 1) * 0.18 # Was 0.05
        $rFStock = 0.04 + ((Get-Random -Minimum 0.0 -Maximum 1.0) * 2 - 1) * 0.35 # Ken NERF via risk 0.35

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

        $pNew = ($playerCoins * 0.2) * (1 + $rCash) +
                ($playerCoins * 0.2) * (1 + $rDBond) +
                ($playerCoins * 0.2) * (1 + $rFBond) +
                ($playerCoins * 0.2) * (1 + $rDStock) +
                ($playerCoins * 0.2) * (1 + $rFStock)
        $playerCoins = $pNew

        $kenCoins = $kenCoins * (1 + $rFStock)

        if ($rowPanicked) {
            $rowCoins = $rowCoins * (1 + $rCash)
            $rowPanicked = $false
        } else {
            # Row nerfed slightly (more cash)
            $rowCoins = ($rowCoins * 0.6) * (1 + $rCash) +
                        ($rowCoins * 0.24) * (1 + $rDBond) +
                        ($rowCoins * 0.16) * (1 + $rDStock)
        }
        if ($event -eq "CRASH") { $rowPanicked = $true }
    }

    if ($playerCoins -ge $kenCoins -and $playerCoins -ge $rowCoins) {
        $playerWins++
    } elseif ($kenCoins -gt $playerCoins -and $kenCoins -ge $rowCoins) {
        $kenWins++
    } else {
        $rowWins++
    }
}

Write-Host "Player Wins: $playerWins"
Write-Host "Ken Wins: $kenWins"
Write-Host "Row Wins: $rowWins"
