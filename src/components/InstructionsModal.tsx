"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Info, ArrowLeft } from "lucide-react"
import wheatIcon from "@/assets/wheat-icon.jpg"
import goldIcon from "@/assets/gold-icon.jpg"

interface InstructionsModalProps {
  isOpen: boolean
  onClose: () => void
  stats: { attack: number; defense: number }
}

export default function InstructionsModal({ isOpen, onClose, stats }: InstructionsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="bg-slate-900/95 backdrop-blur-sm border-slate-700 shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="gap-2 bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Island
              </Button>
              <Info className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Instructions & Information</h2>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Daily Production Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Daily Production</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center bg-slate-800/50 rounded-lg p-4">
                <img src={wheatIcon || "/placeholder.svg"} alt="Wheat" className="w-8 h-8 rounded mx-auto mb-2" />
                <div className="text-lg font-bold text-green-400">+25</div>
                <div className="text-xs text-slate-400">Wheat/day</div>
              </div>
              <div className="text-center bg-slate-800/50 rounded-lg p-4">
                <img src={goldIcon || "/placeholder.svg"} alt="Gold" className="w-8 h-8 rounded mx-auto mb-2" />
                <div className="text-lg font-bold text-yellow-400">+15</div>
                <div className="text-xs text-slate-400">Gold/day</div>
              </div>
              <div className="text-center bg-slate-800/50 rounded-lg p-4">
                <div className="text-2xl mb-2">⚔️</div>
                <div className="text-lg font-bold text-red-400">{stats.attack}</div>
                <div className="text-xs text-slate-400">Attack Power</div>
              </div>
              <div className="text-center bg-slate-800/50 rounded-lg p-4">
                <div className="text-2xl mb-2">🛡️</div>
                <div className="text-lg font-bold text-blue-400">{stats.defense}</div>
                <div className="text-xs text-slate-400">Defense Power</div>
              </div>
            </div>
          </div>

          {/* Instructions Section */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Game Instructions</h3>
            <div className="space-y-3 text-slate-300">
              <div className="flex items-start gap-3 bg-slate-800/30 rounded-lg p-3">
                <div className="text-green-400 font-bold">•</div>
                <p>Click "Build" button to select a building type, then click on an empty unlocked hex to place it</p>
              </div>
              <div className="flex items-start gap-3 bg-slate-800/30 rounded-lg p-3">
                <div className="text-yellow-400 font-bold">•</div>
                <p>Locked hexes (🔒) can be purchased for 50 Gold each to expand your island</p>
              </div>
              <div className="flex items-start gap-3 bg-slate-800/30 rounded-lg p-3">
                <div className="text-blue-400 font-bold">•</div>
                <p>Build farms and mines for daily resource production</p>
              </div>
              <div className="flex items-start gap-3 bg-slate-800/30 rounded-lg p-3">
                <div className="text-red-400 font-bold">•</div>
                <p>Build defense towers and troop camps to increase your combat stats</p>
              </div>
              <div className="flex items-start gap-3 bg-slate-800/30 rounded-lg p-3">
                <div className="text-purple-400 font-bold">•</div>
                <p>Use Trade Inbox to manage incoming trade proposals from other players</p>
              </div>
              <div className="flex items-start gap-3 bg-slate-800/30 rounded-lg p-3">
                <div className="text-orange-400 font-bold">•</div>
                <p>Check Attack History to see who has attacked your island and how much you've lost</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
