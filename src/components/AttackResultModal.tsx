"use client"

import type React from "react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, Coins, X } from "lucide-react"

export interface AttackResult {
  won: boolean
  goldEarned: number
  targetIsland: string
}

export interface AttackResultModalProps {
  isOpen: boolean
  onClose: () => void
  result: AttackResult | null
}

const AttackResultModal: React.FC<AttackResultModalProps> = ({ isOpen, onClose, result }) => {
  if (!result) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-md border-2 border-amber-500/50">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-amber-900/20 rounded-lg" />

        <div className="relative z-10 text-center space-y-6 p-6">
          {/* Result Icon */}
          <div className="flex justify-center">
            {result.won ? (
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg">
                <X className="w-10 h-10 text-white" />
              </div>
            )}
          </div>

          {/* Result Text */}
          <div className="space-y-2">
            <h2 className={`text-3xl font-bold ${result.won ? "text-amber-400" : "text-red-400"}`}>
              {result.won ? "VICTORY!" : "DEFEAT!"}
            </h2>
            <p className="text-white/80">
              {result.won
                ? `You successfully conquered ${result.targetIsland}!`
                : `Your attack on ${result.targetIsland} failed!`}
            </p>
          </div>

          {/* Gold Reward */}
          {result.won && result.goldEarned > 0 && (
            <Card className="bg-amber-900/30 border-amber-500/50 p-4">
              <div className="flex items-center justify-center gap-3">
                <Coins className="w-8 h-8 text-amber-400" />
                <div className="text-center">
                  <p className="text-amber-400 font-bold text-xl">+{result.goldEarned} Gold</p>
                  <p className="text-white/60 text-sm">Plundered from enemy</p>
                </div>
              </div>
            </Card>
          )}

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border-slate-500"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AttackResultModal
