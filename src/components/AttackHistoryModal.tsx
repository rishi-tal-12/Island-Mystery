import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Sword, Coins, Calendar } from "lucide-react"

interface AttackRecord {
  id: string
  attackerName: string
  attackerIsland: string
  goldLost: number
  timestamp: string
  wasSuccessful: boolean
}

interface AttackHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  attackHistory: AttackRecord[]
}

export default function AttackHistoryModal({ isOpen, onClose, attackHistory }: AttackHistoryModalProps) {
  const totalGoldLost = attackHistory
    .filter((attack) => attack.wasSuccessful)
    .reduce((sum, attack) => sum + attack.goldLost, 0)

  const successfulAttacks = attackHistory.filter((attack) => attack.wasSuccessful).length
  const failedAttacks = attackHistory.filter((attack) => !attack.wasSuccessful).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-red-900/95 backdrop-blur-md border-2 border-red-500/50 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-red-400 text-xl flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Attack History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-2">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-red-800/30 border-red-600/50 p-3 text-center">
              <div className="text-red-300 text-sm">Total Attacks</div>
              <div className="text-white text-2xl font-bold">{attackHistory.length}</div>
            </Card>
            <Card className="bg-red-800/30 border-red-600/50 p-3 text-center">
              <div className="text-red-300 text-sm">Successful</div>
              <div className="text-red-400 text-2xl font-bold">{successfulAttacks}</div>
            </Card>
            <Card className="bg-red-800/30 border-red-600/50 p-3 text-center">
              <div className="text-red-300 text-sm">Gold Lost</div>
              <div className="text-amber-400 text-2xl font-bold">{totalGoldLost}</div>
            </Card>
          </div>

          {/* Attack Records */}
          <div className="space-y-3">
            {attackHistory.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-600 p-8 text-center">
                <Shield className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-slate-400">Your island has never been attacked!</p>
                <p className="text-slate-500 text-sm">Your defenses are strong.</p>
              </Card>
            ) : (
              attackHistory.map((attack) => (
                <Card key={attack.id} className="bg-red-800/20 border-red-600/30 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sword className="w-4 h-4 text-red-400" />
                        <span className="text-white font-semibold">{attack.attackerName}</span>
                        <span className="text-slate-400">from {attack.attackerIsland}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-300">{new Date(attack.timestamp).toLocaleDateString()}</span>
                        </div>

                        {attack.wasSuccessful && (
                          <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-amber-400" />
                            <span className="text-amber-400">-{attack.goldLost} Gold</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant={attack.wasSuccessful ? "destructive" : "secondary"}
                      className={attack.wasSuccessful ? "bg-red-600" : "bg-green-600"}
                    >
                      {attack.wasSuccessful ? "Defeated" : "Defended"}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
