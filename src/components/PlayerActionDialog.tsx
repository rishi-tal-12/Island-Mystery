"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sword, Handshake, User } from "lucide-react"

interface Island {
  id: string
  name: string
  owner: string
  isPlayer: boolean
  position: { x: number; y: number }
  power: number
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {island.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Island Info */}
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Owner:</span>
                <span className="text-sm text-muted-foreground">{island.owner}</span>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full gap-2 bg-attack hover:bg-attack/80 text-attack-foreground"
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
              variant="outline"
              className="w-full gap-2 bg-trade hover:bg-trade/80 text-trade-foreground border-trade"
              onClick={() => {
                onTrade(island)
                onClose()
              }}
              disabled={!canTrade}
            >
              <Handshake className="w-4 h-4" />
              Propose Trade
            </Button>

            <Button variant="secondary" className="w-full" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
