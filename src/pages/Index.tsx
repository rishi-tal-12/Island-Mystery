"use client"

import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import LandingScreen from "@/components/LandingScreen"
import HowToPlay from "@/components/HowToPlay"
import GameMap from "@/components/GameMap"
import IslandViewHex from "@/components/IslandViewHex"
import PlayerActionDialog from "@/components/PlayerActionDialog"
import AttackResultModal, { type AttackResult } from "@/components/AttackResultModal"
import TradeProposalModal from "@/components/TradeProposalModal"
import PVPWaitingScreen from "../components/PVPWaitingScreen"
import PVPBattleScreen from "../components/PVPBattleScreen"

interface Island {
  id: string
  name: string
  owner: string
  isPlayer: boolean
  position: { x: number; y: number }
  power: number
}

type GameState = "landing" | "howToPlay" | "map" | "island" | "pvpWaiting" | "pvpBattle"

const Index = () => {
  const [gameState, setGameState] = useState<GameState>("landing")
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)

  const [showAttackResult, setShowAttackResult] = useState(false)
  const [showTradeProposal, setShowTradeProposal] = useState(false)
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null)

  const handleSelectIsland = (island: Island) => {
    if (island.isPlayer) {
      setSelectedIsland(island)
      setGameState("island")
    } else {
      setSelectedIsland(island)
      setShowActionDialog(true)
    }
  }

  const handleBackToMap = () => {
    setGameState("map")
    setSelectedIsland(null)
  }

  const handleEnterGame = () => {
    setGameState("map")
  }

  const handleHowToPlay = () => {
    setGameState("howToPlay")
  }

  const handlePVPMode = () => {
    setGameState("pvpWaiting")
  }

  const handlePlayerConnected = () => {
    setGameState("pvpBattle")
  }

  const handleBackToLanding = () => {
    setGameState("landing")
  }

  const handleAttack = (island: Island) => {
    const playerPower = 100
    const enemyPower = island.power
    const attackSuccess = Math.random() > 0.4 // 60% chance of success
    const goldEarned = attackSuccess ? Math.floor(Math.random() * 50) + 20 : 0

    setAttackResult({
      won: attackSuccess,
      goldEarned,
      targetIsland: island.name,
    })

    setShowAttackResult(true)
    setShowActionDialog(false)
  }

  const handleTrade = (island: Island) => {
    setShowTradeProposal(true)
    setShowActionDialog(false)
  }

  const handleSubmitTrade = (trade: any) => {
    toast({
      title: "Trade Proposal Sent!",
      description: `Sent trade offer to ${trade.targetIsland}`,
    })
    setShowTradeProposal(false)
  }

  return (
    <>
      {gameState === "landing" && (
        <LandingScreen onEnterGame={handleEnterGame} onHowToPlay={handleHowToPlay} onPVPMode={handlePVPMode} />
      )}

      {gameState === "howToPlay" && <HowToPlay onBack={handleBackToLanding} />}

      {gameState === "map" && <GameMap onSelectIsland={handleSelectIsland} />}

      {gameState === "island" && selectedIsland && <IslandViewHex island={selectedIsland} onBack={handleBackToMap} />}

      {gameState === "pvpWaiting" && (
        <PVPWaitingScreen onPlayerConnected={handlePlayerConnected} onBack={handleBackToLanding} />
      )}

      {gameState === "pvpBattle" && <PVPBattleScreen onBack={handleBackToLanding} />}

      <PlayerActionDialog
        island={selectedIsland}
        isOpen={showActionDialog}
        onClose={() => setShowActionDialog(false)}
        onAttack={handleAttack}
        onTrade={handleTrade}
      />

      <AttackResultModal isOpen={showAttackResult} onClose={() => setShowAttackResult(false)} result={attackResult} />

      <TradeProposalModal
        isOpen={showTradeProposal}
        onClose={() => setShowTradeProposal(false)}
        targetIsland={selectedIsland}
        onSubmitTrade={handleSubmitTrade}
      />
    </>
  )
}

export default Index
