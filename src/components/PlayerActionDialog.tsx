"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sword, Handshake, User, X } from "lucide-react"

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

interface PlayerActionDialogProps {
  island: Island | null
  isOpen: boolean
  onClose: () => void
  onAttack: (island: Island) => void
  onTrade: (island: Island) => void
}

export default function PlayerActionDialog({ island, isOpen, onClose, onAttack, onTrade }: PlayerActionDialogProps) {
  if (!island) return null

  const canAttack = true // Simplified logic since power is removed
  const canTrade = true // Always allow trade

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-sky-200 border-sky-300 rounded-2xl p-6">
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2 text-gray-800 text-lg font-semibold">
            <User className="w-5 h-5 text-gray-600" />
            {island.name}
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 w-8 h-8 bg-transparent hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Card className="p-4 bg-amber-100 border-amber-200 rounded-xl">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Owner:</span>
                <span className="text-sm text-gray-600 font-medium">{island.owner}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Address:</span>
                <span className="text-xs text-gray-600 font-mono">
                  {island.address.length > 10 ? `${island.address.slice(0, 6)}...${island.address.slice(-4)}` : island.address}
                </span>
              </div>
              {island.wheat !== undefined && island.gold !== undefined && (
                <div className="flex justify-between items-center pt-2 border-t border-amber-300">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">🌾</span>
                      <span className="text-sm font-medium text-gray-700">{island.wheat}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">💰</span>
                      <span className="text-sm font-medium text-gray-700">{island.gold}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-3">
            <Button
              className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white rounded-xl py-3 font-medium text-base shadow-sm"
              onClick={() => {
                onAttack(island)
                onClose()
              }}
              disabled={!canAttack}
            >
              <Sword className="w-4 h-4" />
              Attack Island
            </Button>

            <Button
              className="w-full gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 font-medium text-base shadow-sm"
              onClick={() => {
                onTrade(island)
                onClose()
              }}
              disabled={!canTrade}
            >
              <Handshake className="w-4 h-4" />
              Propose Trade
            </Button>

            <Button
              className="w-full bg-green-400 hover:bg-green-500 text-white rounded-xl py-3 font-medium text-base shadow-sm"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
