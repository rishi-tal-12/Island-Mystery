import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import LandingScreen from "@/components/LandingScreen";
import HowToPlay from "@/components/HowToPlay";
import GameMap from "@/components/GameMap";
import IslandViewHex from "@/components/IslandViewHex";
import PlayerActionDialog from "@/components/PlayerActionDialog";

interface Island {
  id: string;
  name: string;
  owner: string;
  isPlayer: boolean;
  position: { x: number; y: number };
  power: number;
}

type GameState = "landing" | "howToPlay" | "map" | "island";

const Index = () => {
  const [gameState, setGameState] = useState<GameState>("landing");
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);

  const handleSelectIsland = (island: Island) => {
    if (island.isPlayer) {
      setSelectedIsland(island);
      setGameState("island");
    } else {
      setSelectedIsland(island);
      setShowActionDialog(true);
    }
  };

  const handleBackToMap = () => {
    setGameState("map");
    setSelectedIsland(null);
  };

  const handleEnterGame = () => {
    setGameState("map");
  };

  const handleHowToPlay = () => {
    setGameState("howToPlay");
  };

  const handleBackToLanding = () => {
    setGameState("landing");
  };

  const handleAttack = (island: Island) => {
    toast({
      title: "Attack Initiated!",
      description: `Launching attack on ${island.name}...`,
    });
  };

  const handleTrade = (island: Island) => {
    toast({
      title: "Trade Proposal",
      description: `Sending trade request to ${island.owner}...`,
    });
  };

  return (
    <>
      {gameState === "landing" && (
        <LandingScreen 
          onEnterGame={handleEnterGame} 
          onHowToPlay={handleHowToPlay}
        />
      )}

      {gameState === "howToPlay" && (
        <HowToPlay onBack={handleBackToLanding} />
      )}

      {gameState === "map" && (
        <GameMap onSelectIsland={handleSelectIsland} />
      )}
      
      {gameState === "island" && selectedIsland && (
        <IslandViewHex 
          island={selectedIsland} 
          onBack={handleBackToMap}
        />
      )}

      <PlayerActionDialog
        island={selectedIsland}
        isOpen={showActionDialog}
        onClose={() => setShowActionDialog(false)}
        onAttack={handleAttack}
        onTrade={handleTrade}
      />
    </>
  );
};

export default Index;
