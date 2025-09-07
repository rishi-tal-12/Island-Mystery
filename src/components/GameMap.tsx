"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card } from "@/components/ui/card"
import oceanBackground from "@/assets/ocean-background.jpg"
import islandMain from "@/assets/island-main.jpg"
import { useStoreContract } from "../EtherJs/useStoreContract.js"
import { IslandLogicABI } from "../EtherJs/constants.js"

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

interface GameMapProps {
  onSelectIsland: (island: Island) => void
}

// Generate random positions for other islands, avoiding the user's island position
const generateRandomPosition = (existingPositions: { x: number; y: number }[], index: number) => {
  const minDistance = 15; // Minimum distance between islands
  let attempts = 0;
  let position;
  
  do {
    position = {
      x: Math.random() * 80 + 10, // 10-90% to avoid edges
      y: Math.random() * 60 + 20, // 20-80% to avoid edges
    };
    attempts++;
  } while (
    attempts < 50 && 
    existingPositions.some(pos => 
      Math.sqrt(Math.pow(pos.x - position.x, 2) + Math.pow(pos.y - position.y, 2)) < minDistance
    )
  );
  
  return position;
};

export default function GameMap({ onSelectIsland }: GameMapProps) {
  const { mainContract, signer, walletAddress } = useStoreContract() as any;
  const [selectedIsland, setSelectedIsland] = useState<string | null>(null)
  const [islands, setIslands] = useState<Island[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fixed position for user's island
  const USER_ISLAND_POSITION = { x: 30, y: 40 };

  const loadIslands = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!mainContract || !signer) {
        // If no contract available, show only user's island as fallback
        const userIsland: Island = {
          id: "user-island",
          name: "Your Island",
          owner: "You",
          isPlayer: true,
          position: USER_ISLAND_POSITION,
          power: 100,
          address: walletAddress || "Not Connected"
        };
        setIslands([userIsland]);
        setLoading(false);
        return;
      }

      // Get all registered islands from the contract
      const registeredIslands = await mainContract.getAllRegisteredIslands();
      const loadedIslands: Island[] = [];
      const existingPositions = [USER_ISLAND_POSITION];

      for (let i = 0; i < registeredIslands.length; i++) {
        const islandAddress = registeredIslands[i];
        
        try {
          // Create island contract instance
          const islandContract = new ethers.Contract(islandAddress, IslandLogicABI, signer);
          const owner = await islandContract.owner();
          
          // Check if this is the current user's island
          const isCurrentUser = walletAddress && owner.toLowerCase() === walletAddress.toLowerCase();
          
          const island: Island = {
            id: `island-${i}`,
            name: isCurrentUser ? "Your Island" : `Island ${i + 1}`,
            owner: isCurrentUser ? "You" : `${owner.slice(0, 6)}...${owner.slice(-4)}`,
            isPlayer: isCurrentUser,
            position: isCurrentUser ? USER_ISLAND_POSITION : generateRandomPosition(existingPositions, i),
            power: 100, // Default power, will be updated when clicked
            address: islandAddress
          };

          if (!isCurrentUser) {
            existingPositions.push(island.position);
          }
          
          loadedIslands.push(island);
        } catch (err) {
          console.error(`Error loading island ${islandAddress}:`, err);
        }
      }

      // If no islands found or user's island not found, add a default user island
      if (!loadedIslands.some(island => island.isPlayer)) {
        const userIsland: Island = {
          id: "user-island",
          name: "Your Island",
          owner: "You",
          isPlayer: true,
          position: USER_ISLAND_POSITION,
          power: 100,
          address: walletAddress || "Not Connected"
        };
        loadedIslands.unshift(userIsland);
      }

      setIslands(loadedIslands);
    } catch (err) {
      console.error("Error loading islands:", err);
      setError("Failed to load islands");
      
      // Fallback to show user's island only
      const userIsland: Island = {
        id: "user-island",
        name: "Your Island",
        owner: "You",
        isPlayer: true,
        position: USER_ISLAND_POSITION,
        power: 100,
        address: walletAddress || "Not Connected"
      };
      setIslands([userIsland]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIslands();
  }, [mainContract, signer, walletAddress]);

  const handleIslandClick = async (island: Island) => {
    setSelectedIsland(island.id);
    
    // If it's not the user's island, fetch stats
    if (!island.isPlayer && mainContract && signer) {
      try {
        const islandContract = new ethers.Contract(island.address, IslandLogicABI, signer);
        const stats = await islandContract.getStats();
        
        const updatedIsland = {
          ...island,
          wheat: Number(stats[2].toString()),
          gold: Number(stats[3].toString())
        };
        
        onSelectIsland(updatedIsland);
      } catch (err) {
        console.error("Error fetching island stats:", err);
        onSelectIsland(island);
      }
    } else {
      onSelectIsland(island);
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${oceanBackground})` }} />
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-lg">
          <div className="px-6 py-4">
            <p className="text-lg text-card-foreground">Loading islands...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Ocean Background */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${oceanBackground})` }} />

      {/* Game Title */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <Card className="bg-gradient-to-r from-accent to-accent/80 border-accent/50 shadow-lg">
          <div className="px-6 py-3">
            <h1 className="text-2xl font-bold text-accent-foreground">Arland - World Map</h1>
          </div>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10">
          <Card className="bg-red-900/80 border-red-500/50 shadow-lg">
            <div className="px-4 py-2">
              <p className="text-red-200">{error}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Islands */}
      {islands.map((island) => (
        <div
          key={island.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110"
          style={{
            left: `${island.position.x}%`,
            top: `${island.position.y}%`,
          }}
          onClick={() => handleIslandClick(island)}
        >
          <div
            className={`relative ${selectedIsland === island.id ? "ring-4 ring-accent ring-opacity-60 rounded-full" : ""}`}
          >
            {/* Island Address Display */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
              <Card className="bg-black/70 backdrop-blur-sm border-white/20 px-2 py-1">
                <p className="text-xs text-white font-mono">
                  {island.address.length > 10 ? `${island.address.slice(0, 6)}...${island.address.slice(-4)}` : island.address}
                </p>
              </Card>
            </div>
            
            <img
              src={islandMain || "/placeholder.svg"}
              alt={island.name}
              className="w-24 h-24 rounded-full shadow-lg border-4 border-white/50"
            />
            {island.isPlayer && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full border-2 border-white shadow-md flex items-center justify-center">
                <span className="text-xs font-bold text-accent-foreground">★</span>
              </div>
            )}
          </div>

          <Card className="mt-2 bg-card/90 backdrop-blur-sm border-border/50 shadow-md">
            <div className="px-3 py-2 text-center">
              <p className="font-semibold text-sm text-card-foreground">{island.name}</p>
              <p className="text-xs text-muted-foreground">{island.owner}</p>
              {island.wheat !== undefined && island.gold !== undefined && (
                <div className="text-xs text-muted-foreground mt-1">
                  🌾 {island.wheat} | 💰 {island.gold}
                </div>
              )}
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}
