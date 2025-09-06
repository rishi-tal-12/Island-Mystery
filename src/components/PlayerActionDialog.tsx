import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sword, Handshake, User, Zap } from "lucide-react";

interface Island {
  id: string;
  name: string;
  owner: string;
  isPlayer: boolean;
  position: { x: number; y: number };
  power: number;
}

interface PlayerActionDialogProps {
  island: Island | null;
  isOpen: boolean;
  onClose: () => void;
  onAttack: (island: Island) => void;
  onTrade: (island: Island) => void;
}

export default function PlayerActionDialog({ 
  island, 
  isOpen, 
  onClose, 
  onAttack, 
  onTrade 
}: PlayerActionDialogProps) {
  if (!island) return null;

  const canAttack = island.power <= 120; // Example logic
  const canTrade = true; // Always allow trade

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
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Power:</span>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-accent" />
                  <span className="text-sm font-bold text-primary">{island.power}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full gap-2 bg-attack hover:bg-attack/80 text-attack-foreground"
              onClick={() => {
                onAttack(island);
                onClose();
              }}
              disabled={!canAttack}
            >
              <Sword className="w-4 h-4" />
              Attack Island
              {!canAttack && (
                <span className="text-xs opacity-75">(Too powerful!)</span>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2 bg-trade hover:bg-trade/80 text-trade-foreground border-trade"
              onClick={() => {
                onTrade(island);
                onClose();
              }}
              disabled={!canTrade}
            >
              <Handshake className="w-4 h-4" />
              Propose Trade
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>

          {/* Combat Preview */}
          {canAttack && (
            <Card className="p-3 bg-muted/50">
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Battle Preview:</p>
                <p>Your Power: 100 vs Their Power: {island.power}</p>
                <p className="text-accent">
                  {island.power < 100 ? "Victory likely!" : "Challenging battle!"}
                </p>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}