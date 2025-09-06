"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface Building {
  type: "farm" | "mine" | "defense" | "troop"
  name: string
  icon: string
  cost: { wheat: number; gold: number }
  production: { wheat: number; gold: number }
  description: string
}

interface BuildingSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  buildings: Building[]
  resources: { wheat: number; gold: number }
  onSelectBuilding: (buildingType: Building["type"]) => void
}

export default function BuildingSelectionModal({
  isOpen,
  onClose,
  buildings,
  resources,
  onSelectBuilding,
}: BuildingSelectionModalProps) {
  if (!isOpen) return null

  const canAfford = (building: Building) => {
    return resources.wheat >= building.cost.wheat && resources.gold >= building.cost.gold
  }

  const handleBuildingSelect = (buildingType: Building["type"]) => {
    onSelectBuilding(buildingType)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 bg-slate-900/95 backdrop-blur-sm border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Select Building to Place</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {buildings.map((building) => {
              const affordable = canAfford(building)
              return (
                <Button
                  key={building.type}
                  variant="outline"
                  className={`flex flex-col gap-3 h-auto p-4 ${
                    affordable
                      ? "bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/70 hover:border-slate-500"
                      : "bg-red-900/20 border-red-500/30 text-red-300 cursor-not-allowed"
                  }`}
                  disabled={!affordable}
                  onClick={() => handleBuildingSelect(building.type)}
                >
                  <img
                    src={building.icon || "/placeholder.svg"}
                    alt={building.name}
                    className="w-12 h-12 rounded mx-auto"
                  />
                  <div className="text-center">
                    <div className="font-semibold text-sm">{building.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{building.description}</div>
                    <div className="text-xs mt-2 font-medium">
                      Cost: {building.cost.wheat > 0 && `${building.cost.wheat}🌾`}
                      {building.cost.wheat > 0 && building.cost.gold > 0 && " "}
                      {building.cost.gold > 0 && `${building.cost.gold}🪙`}
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}
