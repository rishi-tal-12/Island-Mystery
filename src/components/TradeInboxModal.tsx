"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, X, ArrowRightLeft } from "lucide-react"

interface TradeOffer {
  id: string
  senderAddress: string
  offerText: string
  requestText: string
}

interface TradeInboxModalProps {
  isOpen: boolean
  onClose: () => void
  trades: TradeOffer[]
  onAcceptTrade: (tradeId: string) => void
  onRejectTrade: (tradeId: string) => void
  disabled?: boolean
}

export default function TradeInboxModal({
  isOpen,
  onClose,
  trades,
  onAcceptTrade,
  onRejectTrade,
  disabled,
}: TradeInboxModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-900/95 backdrop-blur-md border-2 border-purple-500/50 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-purple-400 text-xl flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Trade Inbox ({trades.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-2">
          {trades.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-600 p-8 text-center">
              <p className="text-slate-400">No trade offers received yet</p>
            </Card>
          ) : (
            trades.map((trade) => (
              <Card key={trade.id} className="bg-slate-800/50 border-slate-600 p-4">
                <div className="space-y-4">
                  {/* Trade Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold truncate max-w-[250px]">
                        {trade.senderAddress}
                      </h3>
                      <p className="text-slate-400 text-sm">Incoming trade request</p>
                    </div>
                  </div>

                  {/* Trade Details */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-center text-white font-medium whitespace-pre-line">
                      <span className="text-green-400">They Offer:</span> {trade.offerText}{" "}
                      <br />
                      <span className="text-blue-400">They Want:</span> {trade.requestText}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => onAcceptTrade(trade.id)}
                      disabled={disabled}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Accept Trade
                    </Button>
                    <Button
                      onClick={() => onRejectTrade(trade.id)}
                      disabled={disabled}
                      variant="outline"
                      className="flex-1 border-red-500 text-red-400 hover:bg-red-900/20 gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
