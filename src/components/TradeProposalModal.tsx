"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRightLeft, Coins, Wheat } from "lucide-react"
import { useStoreContract } from "../EtherJs/useStoreContract.js"
import { IslandLogicABI } from "../EtherJs/constants.js"

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

interface TradeProposalModalProps {
  isOpen: boolean
  onClose: () => void
  targetIsland: Island | null
  onSubmitTrade: (trade: TradeProposal) => void
}

interface TradeProposal {
  targetIsland: string
  targetIslandAddress: string
  wheatOffered: number
  goldOffered: number
  wheatRequested: number
  goldRequested: number
}

export default function TradeProposalModal({ isOpen, onClose, targetIsland, onSubmitTrade }: TradeProposalModalProps) {
  const { mainContract, signer, contract } = useStoreContract() as any;
  const [wheatOffered, setWheatOffered] = useState<number>(0)
  const [goldOffered, setGoldOffered] = useState<number>(0)
  const [wheatRequested, setWheatRequested] = useState<number>(0)
  const [goldRequested, setGoldRequested] = useState<number>(0)
  const [userResources, setUserResources] = useState({ wheat: 0, gold: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's current resources
  useEffect(() => {
    const fetchUserResources = async () => {
      if (!contract || !signer) return;
      
      try {
        const stats = await contract.getStats();
        setUserResources({
          wheat: Number(stats[2].toString()),
          gold: Number(stats[3].toString())
        });
      } catch (err) {
        console.error("Error fetching user resources:", err);
      }
    };

    if (isOpen) {
      fetchUserResources();
    }
  }, [isOpen, contract, signer]);

  const handleSubmit = async () => {
    if (!targetIsland || !mainContract || !signer) return;

    // Validation
    if (wheatOffered + goldOffered === 0) {
      setError("You must offer at least one resource");
      return;
    }

    if (wheatRequested + goldRequested === 0) {
      setError("You must request at least one resource");
      return;
    }

    if (wheatOffered > userResources.wheat) {
      setError(`You don't have enough wheat. Available: ${userResources.wheat}`);
      return;
    }

    if (goldOffered > userResources.gold) {
      setError(`You don't have enough gold. Available: ${userResources.gold}`);
      return;
    }

    if (targetIsland.wheat !== undefined && wheatRequested > targetIsland.wheat) {
      setError(`Target island doesn't have enough wheat. Available: ${targetIsland.wheat}`);
      return;
    }

    if (targetIsland.gold !== undefined && goldRequested > targetIsland.gold) {
      setError(`Target island doesn't have enough gold. Available: ${targetIsland.gold}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call tradeRequest function on mainContract
      const tx = await mainContract.connect(signer).tradeRequest(
        targetIsland.address,
        wheatOffered,
        goldOffered,
        wheatRequested,
        goldRequested
      );

      await tx.wait();

      const trade: TradeProposal = {
        targetIsland: targetIsland.name,
        targetIslandAddress: targetIsland.address,
        wheatOffered,
        goldOffered,
        wheatRequested,
        goldRequested,
      };

      onSubmitTrade(trade);
      onClose();

      // Reset form
      setWheatOffered(0);
      setGoldOffered(0);
      setWheatRequested(0);
      setGoldRequested(0);
      setError(null);
    } catch (err: any) {
      console.error("Error submitting trade:", err);
      setError(err.message || "Failed to submit trade proposal");
    } finally {
      setLoading(false);
    }
  };

  if (!targetIsland) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-900/95 backdrop-blur-md border-2 border-blue-500/50">
        <DialogHeader>
          <DialogTitle className="text-blue-400 text-xl">Trade Proposal to {targetIsland.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-2">
          {/* Error Message */}
          {error && (
            <Card className="bg-red-900/50 border-red-500/50 p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </Card>
          )}

          {/* Your Resources Display */}
          <Card className="bg-slate-800/50 border-slate-600 p-3">
            <Label className="text-white/80 font-semibold mb-2 block">Your Resources:</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Wheat className="w-4 h-4 text-amber-600" />
                <span className="text-white text-sm">{userResources.wheat}</span>
              </div>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-white text-sm">{userResources.gold}</span>
              </div>
            </div>
          </Card>

          {/* Your Offer */}
          <Card className="bg-slate-800/50 border-slate-600 p-4">
            <Label className="text-green-400 font-semibold mb-3 block">You Offer:</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/80 text-sm flex items-center gap-1">
                  <Wheat className="w-4 h-4 text-amber-600" />
                  Wheat
                </Label>
                <Input
                  type="number"
                  min="0"
                  max={userResources.wheat}
                  value={wheatOffered}
                  onChange={(e) => setWheatOffered(Number(e.target.value) || 0)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-white/80 text-sm flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Gold
                </Label>
                <Input
                  type="number"
                  min="0"
                  max={userResources.gold}
                  value={goldOffered}
                  onChange={(e) => setGoldOffered(Number(e.target.value) || 0)}
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
                <Label className="text-white/80 text-sm flex items-center gap-1">
                  <Wheat className="w-4 h-4 text-amber-600" />
                  Wheat
                </Label>
                <Input
                  type="number"
                  min="0"
                  max={targetIsland.wheat || 0}
                  value={wheatRequested}
                  onChange={(e) => setWheatRequested(Number(e.target.value) || 0)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-white/80 text-sm flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Gold
                </Label>
                <Input
                  type="number"
                  min="0"
                  max={targetIsland.gold || 0}
                  value={goldRequested}
                  onChange={(e) => setGoldRequested(Number(e.target.value) || 0)}
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
              disabled={loading || (wheatOffered + goldOffered === 0) || (wheatRequested + goldRequested === 0)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
            >
              {loading ? "Sending..." : "Send Trade Proposal"}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>

          {/* Trade Summary */}
          {(wheatOffered > 0 || goldOffered > 0) && (wheatRequested > 0 || goldRequested > 0) && (
            <Card className="bg-blue-900/30 border-blue-500/50 p-3">
              <p className="text-blue-300 text-sm text-center">
                Trading {wheatOffered > 0 ? `${wheatOffered} wheat` : ""}{wheatOffered > 0 && goldOffered > 0 ? " + " : ""}{goldOffered > 0 ? `${goldOffered} gold` : ""} 
                {" for "}
                {wheatRequested > 0 ? `${wheatRequested} wheat` : ""}{wheatRequested > 0 && goldRequested > 0 ? " + " : ""}{goldRequested > 0 ? `${goldRequested} gold` : ""}
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
