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
import { useStoreContract } from "../EtherJs/useStoreContract.js"

interface Island {
  id: string
  name: string
  owner: string
  isPlayer: boolean
  position: { x: number; y: number }
  power: number
  address: string
  wheat?: number
  gold?: number
}

type GameState = "landing" | "howToPlay" | "map" | "island" | "pvpWaiting" | "pvpBattle" | "pvpVictory"

const Index = () => {
  const { mainContract, signer } = useStoreContract() as any;
  const [gameState, setGameState] = useState<GameState>("landing")
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)

  const [showAttackResult, setShowAttackResult] = useState(false)
  const [showTradeProposal, setShowTradeProposal] = useState(false)
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null)
  const [attackLoading, setAttackLoading] = useState(false)

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

  const handlePVPVictory = () => {
    setGameState("landing") // Return to main menu after victory
  }

  const handleBackToLanding = () => {
    setGameState("landing")
  }

  const handleAttack = async (island: Island) => {
    if (!mainContract || !signer || attackLoading) return;

    try {
      setAttackLoading(true);
      setShowActionDialog(false);

      // Call attack function on mainContract
      const tx = await mainContract.connect(signer).attack(island.address);
      await tx.wait();

      // For now, we'll show a success result
      // In a real implementation, you'd listen to events to get the actual result
      setAttackResult({
        won: true,
        goldEarned: 25, // This would come from the contract event
        targetIsland: island.name,
      });

      setShowAttackResult(true);

      toast({
        title: "Attack Successful!",
        description: `Successfully attacked ${island.name}`,
      });
    } catch (err: any) {
      console.error("Attack failed:", err);
      
      // Show failure result
      setAttackResult({
        won: false,
        goldEarned: 0,
        targetIsland: island.name,
      });

      setShowAttackResult(true);

      toast({
        title: "Attack Failed",
        description: err.message || "Failed to attack island",
        variant: "destructive",
      });
    } finally {
      setAttackLoading(false);
    }
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

      {gameState === "pvpBattle" && <PVPBattleScreen onBack={handleBackToLanding} onVictory={handlePVPVictory} />}

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
