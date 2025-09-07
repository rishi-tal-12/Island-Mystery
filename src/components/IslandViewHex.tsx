"use client"

import { useEffect, useState } from "react"
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

import { useStoreContract } from "../EtherJs/useStoreContract.js"

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

// Generate hexagonal pattern: 3-4-5-4-2 formation (18 total)
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

// helper: map solidity enum values to building type strings
const solidityEnumToBuildingType = (enumVal: number): Building["type"] | null => {
  // Island.sol enum: None=0, Farm=1, Mine=2, Defense=3, TroopCamp=4
  switch (enumVal) {
    case 1:
      return "farm"
    case 2:
      return "mine"
    case 3:
      return "defense"
    case 4:
      return "troop"
    default:
      return null
  }
}

// helper: map building type string to solidity enum number
const buildingTypeToEnum = (t: Building["type"]) => {
  switch (t) {
    case "farm":
      return 1
    case "mine":
      return 2
    case "defense":
      return 3
    case "troop":
      return 4
    default:
      return 0
  }
}

export default function IslandViewHex({ island, onBack }: IslandViewHexProps) {
  // useStoreContract is expected to return contract instances and signer
  // we accept several possible names defensively (contract, islandContract, mainContract)
  const { contract, signer, mainContract, islandContract } = useStoreContract() as any

  const [hexes, setHexes] = useState<Hex[]>(generateHexes())
  const [selectedBuildingType, setSelectedBuildingType] = useState<Building["type"] | null>(null)
  const [selectedHex, setSelectedHex] = useState<string | null>(null)

  // replaced with on-chain values fetched on mount
  const [resources, setResources] = useState({ wheat: 50, gold: 100 })
  const [stats, setStats] = useState({ attack: 20, defense: 30 })

  const [showTradeInbox, setShowTradeInbox] = useState(false)
  const [showAttackHistory, setShowAttackHistory] = useState(false)
  const [showBuildingSelection, setShowBuildingSelection] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [lastAttackTime, setLastAttackTime] = useState<Date | null>(null)

  // transaction/loading state
  const [txInProgress, setTxInProgress] = useState(false)
  const [txMessage, setTxMessage] = useState<string | null>(null)

  // TradeOffers: included a senderAddress field so we can pass it to mainContract.tradeExecute
  const [tradeOffers, setTradeOffers] = useState<any[]>([])

  /// leave attack history for now, will implement later
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

  // fetch on-chain island state (stats, resources, unlocked hexes, building types)
  const fetchIslandState = async () => {
    try {
      const islandInstance = contract || islandContract
      if (!islandInstance) return

      // set loading
      setTxMessage("Fetching island state...")
      setTxInProgress(true)

      // get stats
      if (typeof islandInstance.getStats === "function") {
        const raw = await islandInstance.getStats()
        // raw may be a tuple BigNumbers: (attack, defense, wheat, gold)
        const [attackBN, defenseBN, wheatBN, goldBN] = raw
        const attack = Number(attackBN.toString ? attackBN.toString() : attackBN)
        const defense = Number(defenseBN.toString ? defenseBN.toString() : defenseBN)
        const wheat = Number(wheatBN.toString ? wheatBN.toString() : wheatBN)
        const gold = Number(goldBN.toString ? goldBN.toString() : goldBN)

        setStats({ attack, defense })
        setResources({ wheat, gold })
      }

      // get unlockedHexes and building info (if methods exist)
      // island.sol: getTotalHexes(), isHexUnlocked(index), hexes(index) => (bType, lastUpdated)
      let updatedHexes = generateHexes()
      if (typeof islandInstance.getTotalHexes === "function") {
        try {
          const totalHexesBN = await islandInstance.getTotalHexes()
          const totalHexCount = Number(totalHexesBN.toString ? totalHexesBN.toString() : totalHexesBN)

          // for indices 0..17 check unlocked and hex info
          for (let i = 0; i < updatedHexes.length; i++) {
            let isUnlocked = false
            try {
              if (typeof islandInstance.isHexUnlocked === "function") {
                const unlocked = await islandInstance.isHexUnlocked(i)
                isUnlocked = !!unlocked
              } else {
                // fallback: treat first totalHexCount hexes as unlocked
                isUnlocked = i < totalHexCount
              }
            } catch {
              isUnlocked = i < totalHexCount
            }

            let building: Building | null = null
            try {
              if (typeof islandInstance.hexes === "function") {
                const hexStruct = await islandInstance.hexes(i)
                // solidity public getter returns tuple: (bType, lastUpdated)
                const bTypeRaw = hexStruct[0]
                const bTypeNum = Number(bTypeRaw.toString ? bTypeRaw.toString() : bTypeRaw)
                const b = solidityEnumToBuildingType(bTypeNum)
                if (b) {
                  building = { type: b, level: 1 } // island doesn't store level, set 1
                }
              }
            } catch {
              // ignore, assume null
            }

            updatedHexes[i] = { ...updatedHexes[i], isUnlocked, building }
          }
        } catch {
          // ignore, keep defaults
        }
      }

      setHexes(updatedHexes)
    } catch (err) {
      console.error("fetchIslandState error:", err)
    } finally {
      setTxInProgress(false)
      setTxMessage(null)
    }
  }

  useEffect(() => {
    fetchIslandState()
    // intentionally no deps to fetch once on mount; you can add island or contract to re-fetch when they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When user accepts trade: call mainContract.tradeExecute(sender) on-chain (if available)
  const handleAcceptTrade = async (
    tradeId: string,
    offerType: "gold" | "wheat",
    offerAmount: number,
    requestType: "gold" | "wheat",
    requestAmount: number,
  ) => {
    const trade = tradeOffers.find((t) => t.id === tradeId)
    if (!trade) return

    // If mainContract available, attempt on-chain execution. Otherwise, fallback to local update.
    if (mainContract) {
      if (!signer) {
        console.warn("No signer available")
        return
      }

      try {
        setTxInProgress(true)
        setTxMessage("Sending tradeExecute transaction...")

        // the solidity function expects address sender (the original offerer)
        const senderAddress = trade.senderAddress
        const tx = await mainContract.connect(signer).tradeExecute(senderAddress)
        await tx.wait()

        // after confirmation: fetch updated island stats from chain to update UI
        await fetchIslandState()

        // remove trade from list
        setTradeOffers((prev) => prev.filter((t) => t.id !== tradeId))
        console.log("Trade accepted on-chain:", tradeId)
      } catch (err) {
        console.error("tradeExecute error:", err)
      } finally {
        setTxInProgress(false)
        setTxMessage(null)
      }
    } else {
      // fallback: update local UI and remove trade (previous behavior)
      setResources((prev) => ({
        ...prev,
        [offerType]: prev[offerType] + offerAmount,
        [requestType]: prev[requestType] - requestAmount,
      }))

      setTradeOffers((prev) => prev.filter((trade) => trade.id !== tradeId))
      console.log("Trade accepted (local):", tradeId)
    }
  }

  // leave this for now, will implement later
  const handleRejectTrade = (tradeId: string) => {
    // Remove the rejected trade from the list
    setTradeOffers((prev) => prev.filter((trade) => trade.id !== tradeId))
    console.log("Trade rejected:", tradeId)
  }

  const handleHexClick = async (hex: Hex) => {
    if (!hex.isUnlocked) return

    // placing building flow: if a building type selected, call on-chain placeBuilding and wait for confirmation
    if (selectedBuildingType && !hex.building) {
      const buildingType = BUILDING_TYPES.find((bt) => bt.type === selectedBuildingType)
      if (!buildingType) return

      // Check if player has enough resources (local quick check)
      if (!(resources.wheat >= buildingType.cost.wheat && resources.gold >= buildingType.cost.gold)) {
        console.warn("Cannot afford building")
        return
      }

      // If island contract available, call placeBuilding(hexIndex, bTypeEnum)
      const islandInstance = contract || islandContract
      if (islandInstance && typeof islandInstance.placeBuilding === "function" && signer) {
        try {
          setTxInProgress(true)
          setTxMessage("Placing building on-chain...")

          // parse hex index from id like "hex-4"
          const hexIndex = Number(hex.id.split("-")[1])
          const enumVal = buildingTypeToEnum(selectedBuildingType)

          const tx = await islandInstance.connect(signer).placeBuilding(hexIndex, enumVal)
          await tx.wait()

          // after tx confirmed, re-fetch on-chain state to update UI
          await fetchIslandState()
          setSelectedBuildingType(null)
        } catch (err) {
          console.error("placeBuilding error:", err)
        } finally {
          setTxInProgress(false)
          setTxMessage(null)
        }
      } else {
        // fallback local behavior if no contract: update local state immediately
        setHexes((prevHexes) =>
          prevHexes.map((h) => (h.id === hex.id ? { ...h, building: { type: selectedBuildingType!, level: 1 } } : h)),
        )

        setResources((prev) => ({
          wheat: prev.wheat - buildingType.cost.wheat,
          gold: prev.gold - buildingType.cost.gold,
        }))

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
              disabled={txInProgress}
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
            disabled={txInProgress}
          >
            <Mail className="w-4 h-4" />
            Trade Inbox ({tradeOffers.length})
          </Button>

          <Button
            onClick={() => setShowAttackHistory(true)}
            className="bg-red-600/80 hover:bg-red-600 text-white border-red-500/50 gap-2"
            disabled={txInProgress}
          >
            <Shield className="w-4 h-4" />
            Attack History
          </Button>

          <Button
            onClick={() => setShowBuildingSelection(true)}
            className="bg-green-600/80 hover:bg-green-600 text-white border-green-500/50 gap-2"
            disabled={txInProgress}
          >
            <Hammer className="w-4 h-4" />
            Build {selectedBuildingType && `(${BUILDING_TYPES.find((bt) => bt.type === selectedBuildingType)?.name})`}
          </Button>

          {/* Instructions button */}
          <Button
            onClick={() => setShowInstructions(true)}
            className="bg-blue-600/80 hover:bg-blue-600 text-white border-blue-500/50 gap-2"
            disabled={txInProgress}
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

        {txInProgress && txMessage && (
          <Card className="mb-6 bg-yellow-900/60 backdrop-blur-sm border-yellow-500/50">
            <div className="p-3 text-sm text-white">{txMessage}</div>
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
                  onClick={() => !txInProgress && handleHexClick(hex)}
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
        disabled={txInProgress}
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
        canAfford={canAfford}
      />

      {/* Instructions Modal */}
      <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)} stats={stats} />
    </div>
  )
}
