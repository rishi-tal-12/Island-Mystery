"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import oceanBackground from "@/assets/ocean-background.jpg"
import islandMain from "@/assets/island-main.jpg"

interface Island {
  id: string
  name: string
  owner: string
  isPlayer: boolean
  position: { x: number; y: number }
  power: number
}

interface GameMapProps {
  onSelectIsland: (island: Island) => void
}

const MOCK_ISLANDS: Island[] = [
  { id: "1", name: "Your Island", owner: "You", isPlayer: true, position: { x: 30, y: 40 }, power: 100 },
  { id: "2", name: "Island Alpha", owner: "Player 2", isPlayer: false, position: { x: 70, y: 20 }, power: 85 },
  { id: "3", name: "Island Beta", owner: "Player 3", isPlayer: false, position: { x: 15, y: 75 }, power: 120 },
  { id: "4", name: "Island Gamma", owner: "Player 4", isPlayer: false, position: { x: 85, y: 65 }, power: 95 },
  { id: "5", name: "Island Delta", owner: "Player 5", isPlayer: false, position: { x: 50, y: 80 }, power: 110 },
]

export default function GameMap({ onSelectIsland }: GameMapProps) {
  const [selectedIsland, setSelectedIsland] = useState<string | null>(null)

  const handleIslandClick = (island: Island) => {
    setSelectedIsland(island.id)
    onSelectIsland(island)
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

      {/* Islands */}
      {MOCK_ISLANDS.map((island) => (
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
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}
