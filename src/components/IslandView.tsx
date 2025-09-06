import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sword, Shield, Wheat, Package } from "lucide-react";
import buildingIcons from "@/assets/building-icons.jpg";

interface Tile {
  id: string;
  position: { x: number; y: number };
  isUnlocked: boolean;
  building: Building | null;
}

interface Building {
  type: "attack" | "defense" | "farm" | "storage";
  level: number;
}

interface Island {
  id: string;
  name: string;
  owner: string;
  isPlayer: boolean;
  position: { x: number; y: number };
  power: number;
}

interface IslandViewProps {
  island: Island;
  onBack: () => void;
}

const BUILDING_TYPES = [
  { type: "attack" as const, name: "Attack Tower", icon: Sword, color: "building-attack" },
  { type: "defense" as const, name: "Defense Tower", icon: Shield, color: "building-defense" },
  { type: "farm" as const, name: "Farm", icon: Wheat, color: "building-farm" },
  { type: "storage" as const, name: "Storage", icon: Package, color: "building-storage" },
];

// Generate a 6x6 grid of tiles
const generateTiles = (): Tile[] => {
  const tiles: Tile[] = [];
  for (let x = 0; x < 6; x++) {
    for (let y = 0; y < 6; y++) {
      const id = `${x}-${y}`;
      // Center tiles are unlocked, outer tiles are locked
      const isUnlocked = x >= 1 && x <= 4 && y >= 1 && y <= 4;
      tiles.push({
        id,
        position: { x, y },
        isUnlocked,
        building: null,
      });
    }
  }
  return tiles;
};

export default function IslandView({ island, onBack }: IslandViewProps) {
  const [tiles, setTiles] = useState<Tile[]>(generateTiles());
  const [selectedBuildingType, setSelectedBuildingType] = useState<Building["type"] | null>(null);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);

  const handleTileClick = (tile: Tile) => {
    if (!tile.isUnlocked) return;
    
    if (selectedBuildingType && !tile.building) {
      // Place building
      setTiles(prevTiles =>
        prevTiles.map(t =>
          t.id === tile.id
            ? { ...t, building: { type: selectedBuildingType, level: 1 } }
            : t
        )
      );
      setSelectedBuildingType(null);
    } else {
      setSelectedTile(tile.id);
    }
  };

  const getBuildingIcon = (building: Building) => {
    const buildingType = BUILDING_TYPES.find(bt => bt.type === building.type);
    if (!buildingType) return null;
    const Icon = buildingType.icon;
    return <Icon className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Button>
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <div className="px-4 py-2">
              <h1 className="text-xl font-bold text-card-foreground">{island.name}</h1>
              <p className="text-sm text-muted-foreground">Owner: {island.owner}</p>
            </div>
          </Card>
        </div>
        
        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-card-foreground">Power: {island.power}</p>
          </div>
        </Card>
      </div>

      {/* Building Selection */}
      <Card className="mb-6 bg-card/90 backdrop-blur-sm border-border/50">
        <div className="p-4">
          <h3 className="font-semibold text-card-foreground mb-3">Select Building to Place</h3>
          <div className="flex flex-wrap gap-2">
            {BUILDING_TYPES.map((buildingType) => {
              const Icon = buildingType.icon;
              return (
                <Button
                  key={buildingType.type}
                  variant={selectedBuildingType === buildingType.type ? "default" : "outline"}
                  className={`gap-2 ${
                    selectedBuildingType === buildingType.type 
                      ? `bg-${buildingType.color} hover:bg-${buildingType.color}/80` 
                      : ""
                  }`}
                  onClick={() => setSelectedBuildingType(
                    selectedBuildingType === buildingType.type ? null : buildingType.type
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {buildingType.name}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Island Grid */}
      <div className="flex justify-center">
        <Card className="p-6 bg-card/90 backdrop-blur-sm border-border/50 shadow-xl">
          <div className="grid grid-cols-6 gap-2">
            {tiles.map((tile) => (
              <div
                key={tile.id}
                className={`
                  w-16 h-16 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${tile.isUnlocked
                    ? tile.building
                      ? "bg-secondary/80 border-secondary hover:scale-105"
                      : selectedBuildingType
                        ? "bg-accent/20 border-accent hover:bg-accent/40 hover:scale-105"
                        : "bg-muted/50 border-muted hover:bg-muted/80 hover:scale-105"
                    : "bg-border/30 border-border cursor-not-allowed opacity-50"
                  }
                  ${selectedTile === tile.id ? "ring-2 ring-primary" : ""}
                `}
                onClick={() => handleTileClick(tile)}
              >
                <div className="w-full h-full flex items-center justify-center">
                  {tile.building ? (
                    <div className="text-center">
                      {getBuildingIcon(tile.building)}
                      <div className="text-xs font-bold mt-1">L{tile.building.level}</div>
                    </div>
                  ) : tile.isUnlocked ? (
                    <div className="text-2xl text-muted-foreground/50">+</div>
                  ) : (
                    <div className="text-xl text-muted-foreground/30">🔒</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6 bg-card/90 backdrop-blur-sm border-border/50">
        <div className="p-4">
          <h3 className="font-semibold text-card-foreground mb-2">Instructions</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Select a building type above, then click on an empty unlocked tile to place it</p>
            <p>• Gray tiles with locks are locked - unlock them by expanding your island</p>
            <p>• Click on existing buildings to upgrade them</p>
          </div>
        </div>
      </Card>
    </div>
  );
}