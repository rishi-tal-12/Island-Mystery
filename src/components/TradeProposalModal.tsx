"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRightLeft, Coins, Wheat } from "lucide-react"

interface Island {
  id: string
  name: string
  owner: string
  isPlayer: boolean
  position: { x: number; y: number }
  power: number
}

interface TradeProposalModalProps {
  isOpen: boolean
  onClose: () => void
  targetIsland: Island | null
  onSubmitTrade: (trade: TradeProposal) => void
}

interface TradeProposal {
  targetIsland: string
  offerType: "gold" | "wheat"
  offerAmount: number
  requestType: "gold" | "wheat"
  requestAmount: number
}

export default function TradeProposalModal({ isOpen, onClose, targetIsland, onSubmitTrade }: TradeProposalModalProps) {
  const [offerType, setOfferType] = useState<"gold" | "wheat">("gold")
  const [offerAmount, setOfferAmount] = useState<number>(0)
  const [requestType, setRequestType] = useState<"gold" | "wheat">("wheat")
  const [requestAmount, setRequestAmount] = useState<number>(0)

  const handleSubmit = () => {
    if (!targetIsland || offerAmount <= 0 || requestAmount <= 0) return

    const trade: TradeProposal = {
      targetIsland: targetIsland.name,
      offerType,
      offerAmount,
      requestType,
      requestAmount,
    }

    onSubmitTrade(trade)
    onClose()

    // Reset form
    setOfferAmount(0)
    setRequestAmount(0)
  }

  if (!targetIsland) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-900/95 backdrop-blur-md border-2 border-blue-500/50">
        <DialogHeader>
          <DialogTitle className="text-blue-400 text-xl">Trade Proposal to {targetIsland.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-2">
          {/* Your Offer */}
          <Card className="bg-slate-800/50 border-slate-600 p-4">
            <Label className="text-green-400 font-semibold mb-3 block">You Offer:</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/80 text-sm">Resource Type</Label>
                <Select value={offerType} onValueChange={(value: "gold" | "wheat") => setOfferType(value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="gold" className="text-white">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        Gold
                      </div>
                    </SelectItem>
                    <SelectItem value="wheat" className="text-white">
                      <div className="flex items-center gap-2">
                        <Wheat className="w-4 h-4 text-amber-600" />
                        Wheat
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/80 text-sm">Amount</Label>
                <Input
                  type="number"
                  min="1"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(Number.parseInt(e.target.value) || 0)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="0"
                />
              </div>
            </div>
          </Card>

          {/* Trade Arrow */}
          <div className="flex justify-center">
            <div className="bg-blue-600 rounded-full p-3">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* You Request */}
          <Card className="bg-slate-800/50 border-slate-600 p-4">
            <Label className="text-blue-400 font-semibold mb-3 block">You Request:</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/80 text-sm">Resource Type</Label>
                <Select value={requestType} onValueChange={(value: "gold" | "wheat") => setRequestType(value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="gold" className="text-white">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        Gold
                      </div>
                    </SelectItem>
                    <SelectItem value="wheat" className="text-white">
                      <div className="flex items-center gap-2">
                        <Wheat className="w-4 h-4 text-amber-600" />
                        Wheat
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/80 text-sm">Amount</Label>
                <Input
                  type="number"
                  min="1"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(Number.parseInt(e.target.value) || 0)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="0"
                />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={offerAmount <= 0 || requestAmount <= 0 || offerType === requestType}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
            >
              Send Trade Proposal
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
            >
              Cancel
            </Button>
          </div>

          {/* Trade Summary */}
          {offerAmount > 0 && requestAmount > 0 && offerType !== requestType && (
            <Card className="bg-blue-900/30 border-blue-500/50 p-3">
              <p className="text-blue-300 text-sm text-center">
                Trading {offerAmount} {offerType} for {requestAmount} {requestType}
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
