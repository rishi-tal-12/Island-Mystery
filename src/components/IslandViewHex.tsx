"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Mail, Shield, Clock, Hammer, Info } from "lucide-react"
import islandHex from "@/assets/island-hex.png"
import farmIcon from "@/assets/farm-icon.jpg"
import mineIcon from "@/assets/mine-icon.jpg"
import defenseIcon from "@/assets/defense-icon.jpg"
import troopIcon from "@/assets/troop-icon.jpg"
import wheatIcon from "@/assets/wheat-icon.jpg"
import goldIcon from "@/assets/gold-icon.jpg"
import TradeInboxModal from "./TradeInboxModal"
import AttackHistoryModal from "./AttackHistoryModal"
import BuildingSelectionModal from "./BuildingSelectionModal"
import InstructionsModal from "./InstructionsModal"
import Spline from "@splinetool/react-spline"

interface Hex {
  id: string
  position: { x: number; y: number }
  isUnlocked: boolean
  building: Building | null
}

interface Building {
  type: "farm" | "mine" | "defense" | "troop"
  level: number
}

interface Island {
  id: string
  name: string
  owner: string
  isPlayer: boolean
  position: { x: number; y: number }
}

interface IslandViewHexProps {
  island: Island
  onBack: () => void
}

const BUILDING_TYPES = [
  {
    type: "farm" as const,
    name: "Farm",
    icon: farmIcon,
    cost: { wheat: 5, gold: 5 },
    production: { wheat: 5, gold: 0 },
    description: "Produces 5 Wheat daily",
  },
  {
    type: "mine" as const,
    name: "Mine",
    icon: mineIcon,
    cost: { wheat: 5, gold: 5 },
    production: { wheat: 0, gold: 5 },
    description: "Produces 5 Gold daily",
  },
  {
    type: "defense" as const,
    name: "Defense Tower",
    icon: defenseIcon,
    cost: { wheat: 0, gold: 30 },
    production: { wheat: 0, gold: 0 },
    description: "+10 Defense Power",
  },
  {
    type: "troop" as const,
    name: "Troop Camp",
    icon: troopIcon,
    cost: { wheat: 0, gold: 30 },
    production: { wheat: 0, gold: 0 },
    description: "+10 Attack Power",
  },
]

// Generate hexagonal pattern: 3-4-4-4-3 formation (18 total hexes)
const generateHexes = (): Hex[] => {
  const hexes: Hex[] = []

  const hexSize = 80 // Increased from 50 to 80 for better visibility
  const horizontalSpacing = hexSize * 0.9 // Tighter spacing for better fit
  const verticalSpacing = hexSize * 0.8 // Adjusted vertical spacing

  const containerWidth = 800 // Fixed container width
  const containerHeight = 600 // Fixed container height
  const centerX = containerWidth * 0.5
  const centerY = containerHeight * 0.5

  // Define the hexagonal grid structure: 3-4-5-4-2 pattern (18 total)
  const rows = [
    { count: 3, yOffset: -2 * verticalSpacing }, // Top row (3 hexes)
    { count: 4, yOffset: -1 * verticalSpacing }, // Second row (4 hexes)
    { count: 5, yOffset: 0 }, // Middle row (5 hexes - widest)
    { count: 4, yOffset: 1 * verticalSpacing }, // Fourth row (4 hexes)
    { count: 2, yOffset: 2 * verticalSpacing }, // Bottom row (2 hexes)
  ]

  let hexIndex = 0

  rows.forEach((row, rowIndex) => {
    // Calculate starting X position to center the row
    const rowWidth = (row.count - 1) * horizontalSpacing
    const startX = centerX - rowWidth / 2

    // Offset every other row by half a hex width for proper hexagonal alignment
    const xOffset = (rowIndex % 2) * (horizontalSpacing / 2)

    for (let col = 0; col < row.count; col++) {
      const x = startX + col * horizontalSpacing + xOffset
      const y = centerY + row.yOffset

      const id = `hex-${hexIndex}`
      // First 6 hexes are unlocked initially
      const isUnlocked = hexIndex < 6

      hexes.push({
        id,
        position: { x, y },
        isUnlocked,
        building: null,
      })

      hexIndex++
    }
  })

  return hexes
}

export default function IslandViewHex({ island, onBack }: IslandViewHexProps) {
  const [hexes, setHexes] = useState<Hex[]>(generateHexes())
  const [selectedBuildingType, setSelectedBuildingType] = useState<Building["type"] | null>(null)
  const [selectedHex, setSelectedHex] = useState<string | null>(null)

  // Hardcoded player resources
  const [resources, setResources] = useState({ wheat: 50, gold: 100 })
  const [stats, setStats] = useState({ attack: 20, defense: 30 })

  const [showTradeInbox, setShowTradeInbox] = useState(false)
  const [showAttackHistory, setShowAttackHistory] = useState(false)
  const [showBuildingSelection, setShowBuildingSelection] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [lastAttackTime, setLastAttackTime] = useState<Date | null>(null)

  const [tradeOffers, setTradeOffers] = useState([
    {
      id: "1",
      fromPlayer: "Captain Hook",
      fromIsland: "Pirate Cove",
      offerType: "gold" as const,
      offerAmount: 50,
      requestType: "wheat" as const,
      requestAmount: 30,
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      fromPlayer: "Admiral Storm",
      fromIsland: "Storm Island",
      offerType: "wheat" as const,
      offerAmount: 40,
      requestType: "gold" as const,
      requestAmount: 25,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ])

  const [attackHistory] = useState([
    {
      id: "1",
      attackerName: "Blackbeard",
      attackerIsland: "Skull Island",
      goldLost: 25,
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      wasSuccessful: true,
    },
    {
      id: "2",
      attackerName: "Sea Wolf",
      attackerIsland: "Wolf Den",
      goldLost: 0,
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      wasSuccessful: false,
    },
  ])

  const getAttackCooldown = () => {
    if (!lastAttackTime) return null
    const cooldownHours = 6
    const nextAttackTime = new Date(lastAttackTime.getTime() + cooldownHours * 60 * 60 * 1000)
    const now = new Date()

    if (now < nextAttackTime) {
      const remainingMs = nextAttackTime.getTime() - now.getTime()
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60))
      const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
      return `${remainingHours}h ${remainingMinutes}m`
    }
    return null
  }

  const handleAcceptTrade = (
    tradeId: string,
    offerType: "gold" | "wheat",
    offerAmount: number,
    requestType: "gold" | "wheat",
    requestAmount: number,
  ) => {
    // Update resources based on the trade
    setResources((prev) => ({
      ...prev,
      [offerType]: prev[offerType] + offerAmount,
      [requestType]: prev[requestType] - requestAmount,
    }))

    // Remove the accepted trade from the list
    setTradeOffers((prev) => prev.filter((trade) => trade.id !== tradeId))
    console.log("Trade accepted:", tradeId)
  }

  const handleRejectTrade = (tradeId: string) => {
    // Remove the rejected trade from the list
    setTradeOffers((prev) => prev.filter((trade) => trade.id !== tradeId))
    console.log("Trade rejected:", tradeId)
  }

  const handleHexClick = (hex: Hex) => {
    if (!hex.isUnlocked) return

    if (selectedBuildingType && !hex.building) {
      const buildingType = BUILDING_TYPES.find((bt) => bt.type === selectedBuildingType)
      if (!buildingType) return

      // Check if player has enough resources
      if (resources.wheat >= buildingType.cost.wheat && resources.gold >= buildingType.cost.gold) {
        // Place building
        setHexes((prevHexes) =>
          prevHexes.map((h) => (h.id === hex.id ? { ...h, building: { type: selectedBuildingType, level: 1 } } : h)),
        )

        // Deduct resources
        setResources((prev) => ({
          wheat: prev.wheat - buildingType.cost.wheat,
          gold: prev.gold - buildingType.cost.gold,
        }))

        // Update stats if it's attack/defense building
        if (selectedBuildingType === "defense") {
          setStats((prev) => ({ ...prev, defense: prev.defense + 10 }))
        } else if (selectedBuildingType === "troop") {
          setStats((prev) => ({ ...prev, attack: prev.attack + 10 }))
        }

        setSelectedBuildingType(null)
      }
    } else {
      setSelectedHex(hex.id)
    }
  }

  const getBuildingTypeInfo = (buildingType: Building["type"]) => {
    return BUILDING_TYPES.find((bt) => bt.type === buildingType)
  }

  const canAfford = (buildingType: Building["type"]) => {
    const building = BUILDING_TYPES.find((bt) => bt.type === buildingType)
    if (!building) return false
    return resources.wheat >= building.cost.wheat && resources.gold >= building.cost.gold
  }

  const handleBuildingSelect = (buildingType: Building["type"]) => {
    setSelectedBuildingType(buildingType)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0 overflow-hidden z-0">
        <Spline
          scene="https://prod.spline.design/JznyXKXTtB5EOCd5/scene.splinecode"
          className="absolute top-[-1] left-70 w-[150vw] h-[150vh] scale-[1.2] z-[0]"
        />
      </div>

      {/* Ocean Background */}
      <div
        className="absolute inset-0 bg-center bg-contain bg-background/50 bg-blue-900/60 bg-no-repeat"
        style={{
          backgroundImage: `url(${islandHex})`,
        }}
      />

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Map
            </Button>
            <Card className="bg-black/50 backdrop-blur-sm border-white/20">
              <div className="px-4 py-2">
                <h1 className="text-xl font-bold text-white">{island.name}</h1>
                <p className="text-sm text-white/80">Owner: {island.owner}</p>
              </div>
            </Card>
          </div>

          {/* Resource Display */}
          <div className="flex gap-4">
            <Card className="bg-black/50 backdrop-blur-sm border-white/20">
              <div className="px-4 py-2 flex items-center gap-2">
                <img src={wheatIcon || "/placeholder.svg"} alt="Wheat" className="w-6 h-6 rounded" />
                <span className="text-white font-semibold">{resources.wheat}</span>
              </div>
            </Card>
            <Card className="bg-black/50 backdrop-blur-sm border-white/20">
              <div className="px-4 py-2 flex items-center gap-2">
                <img src={goldIcon || "/placeholder.svg"} alt="Gold" className="w-6 h-6 rounded" />
                <span className="text-white font-semibold">{resources.gold}</span>
              </div>
            </Card>
            <Card className="bg-black/50 backdrop-blur-sm border-white/20">
              <div className="px-4 py-2">
                <p className="text-sm text-white">
                  ⚔️ {stats.attack} | 🛡️ {stats.defense}
                </p>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setShowTradeInbox(true)}
            className="bg-purple-600/80 hover:bg-purple-600 text-white border-purple-500/50 gap-2"
          >
            <Mail className="w-4 h-4" />
            Trade Inbox ({tradeOffers.length})
          </Button>

          <Button
            onClick={() => setShowAttackHistory(true)}
            className="bg-red-600/80 hover:bg-red-600 text-white border-red-500/50 gap-2"
          >
            <Shield className="w-4 h-4" />
            Attack History
          </Button>

          <Button
            onClick={() => setShowBuildingSelection(true)}
            className="bg-green-600/80 hover:bg-green-600 text-white border-green-500/50 gap-2"
          >
            <Hammer className="w-4 h-4" />
            Build {selectedBuildingType && `(${BUILDING_TYPES.find((bt) => bt.type === selectedBuildingType)?.name})`}
          </Button>

          {/* Instructions button */}
          <Button
            onClick={() => setShowInstructions(true)}
            className="bg-blue-600/80 hover:bg-blue-600 text-white border-blue-500/50 gap-2"
          >
            <Info className="w-4 h-4" />
            Instructions
          </Button>
        </div>

        {getAttackCooldown() && (
          <Card className="mb-6 bg-orange-900/50 backdrop-blur-sm border-orange-500/50">
            <div className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-orange-300 font-semibold">Attack Cooldown Active</p>
                <p className="text-orange-200 text-sm">Next attack available in: {getAttackCooldown()}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Island View - Centered */}
      <div className="absolute inset-0 z-0">
        {/* Hexagonal Grid Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative bg-black/20 border-2 border-white/30 rounded-lg"
            style={{ width: "800px", height: "600px" }}
          >
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm z-10">
              Hexes: {hexes.length}/18 | Unlocked: {hexes.filter((h) => h.isUnlocked).length}
            </div>

            {hexes.map((hex, index) => {
              const hexSize = 60 // Increased hex size

              return (
                <div
                  key={hex.id}
                  className={`
                    absolute cursor-pointer transition-all duration-200 transform hover:scale-110
                    ${
                      hex.isUnlocked
                        ? hex.building
                          ? "opacity-100"
                          : selectedBuildingType
                            ? "bg-green-500/40 border-2 border-green-400"
                            : "bg-blue-500/30 border-2 border-blue-400"
                        : "bg-gray-500/20 border-2 border-gray-400 cursor-not-allowed"
                    }
                    ${selectedHex === hex.id ? "ring-4 ring-yellow-400" : ""}
                  `}
                  style={{
                    left: `${hex.position.x - hexSize / 2}px`, // Center the hex on its position
                    top: `${hex.position.y - hexSize / 2}px`, // Center the hex on its position
                    width: `${hexSize}px`,
                    height: `${hexSize}px`,
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                  onClick={() => handleHexClick(hex)}
                >
                  <div className="w-full h-full flex items-center justify-center bg-white/10 backdrop-blur-sm">
                    <div className="absolute top-1 left-1 text-xs text-white bg-black/50 rounded px-1">{index + 1}</div>

                    {hex.building ? (
                      <div className="text-center">
                        <img
                          src={getBuildingTypeInfo(hex.building.type)?.icon || "/placeholder.svg"}
                          alt={getBuildingTypeInfo(hex.building.type)?.name}
                          className="w-8 h-8 rounded mx-auto mb-1" // Increased icon size
                        />
                        <div className="text-xs font-bold text-white bg-black/50 rou  nded px-1">
                          L{hex.building.level}
                        </div>
                      </div>
                    ) : hex.isUnlocked ? (
                      <Plus className="w-6 h-6 text-white/80" /> // Increased plus icon size
                    ) : (
                      <div className="text-lg">🔒</div> // Increased lock icon size
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <TradeInboxModal
        isOpen={showTradeInbox}
        onClose={() => setShowTradeInbox(false)}
        trades={tradeOffers}
        onAcceptTrade={handleAcceptTrade}
        onRejectTrade={handleRejectTrade}
      />

      <AttackHistoryModal
        isOpen={showAttackHistory}
        onClose={() => setShowAttackHistory(false)}
        attackHistory={attackHistory}
      />

      <BuildingSelectionModal
        isOpen={showBuildingSelection}
        onClose={() => setShowBuildingSelection(false)}
        buildings={BUILDING_TYPES}
        resources={resources}
        onSelectBuilding={handleBuildingSelect}
      />

      {/* Instructions Modal */}
      <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)} stats={stats} />
    </div>
  )
}
