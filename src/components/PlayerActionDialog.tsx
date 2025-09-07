"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sword, Handshake, User, Coins, Wheat } from "lucide-react"
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

interface PlayerActionDialogProps {
  island: Island | null
  isOpen: boolean
  onClose: () => void
  onAttack: (island: Island) => void
  onTrade: (island: Island) => void
}

export default function PlayerActionDialog({ island, isOpen, onClose, onAttack, onTrade }: PlayerActionDialogProps) {
  const { signer, contract } = useStoreContract() as any;
  const [userStats, setUserStats] = useState({ wheat: 0, gold: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!contract || !signer) return;
      
      try {
        setLoading(true);
        const stats = await contract.getStats();
        setUserStats({
          wheat: parseInt(stats[2].toString()),
          gold: parseInt(stats[3].toString())
        });
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && contract) {
      fetchUserStats();
    }
  }, [isOpen, contract, signer]);

  if (!island) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <User className="w-5 h-5" />
            Island Battle Stats
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Player Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Your Stats */}
            <Card className="p-4 bg-gray-800 border-gray-600">
              <div className="text-center space-y-3">
                <h3 className="font-semibold text-green-400 flex items-center justify-center gap-2">
                  <User className="w-4 h-4" />
                  Your Island
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Wheat className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-white">Wheat</span>
                    </div>
                    <span className="font-bold text-yellow-400">
                      {loading ? "..." : userStats.wheat}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-white">Gold</span>
                    </div>
                    <span className="font-bold text-yellow-500">
                      {loading ? "..." : userStats.gold}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Target Stats */}
            <Card className="p-4 bg-gray-800 border-gray-600">
              <div className="text-center space-y-3">
                <h3 className="font-semibold text-red-400 flex items-center justify-center gap-2">
                  <User className="w-4 h-4" />
                  {island.name}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Wheat className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-white">Wheat</span>
                    </div>
                    <span className="font-bold text-yellow-400">
                      {island.wheat ?? "?"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-white">Gold</span>
                    </div>
                    <span className="font-bold text-yellow-500">
                      {island.gold ?? "?"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Island Info */}
          <Card className="p-3 bg-gray-800 border-gray-600">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Owner of the Island:</span>
                <span className="text-white font-medium">{island.owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Address of the Island:</span>
                <span className="font-mono text-xs text-gray-300">
                  {island.address ? `${island.address.slice(0, 6)}...${island.address.slice(-4)}` : 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={() => onAttack(island)} 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
            >
              <Sword className="w-4 h-4 mr-2" />
              Attack Island
            </Button>
            <Button 
              onClick={() => onTrade(island)} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0"
            >
              <Handshake className="w-4 h-4 mr-2" />
              Propose Trade
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
