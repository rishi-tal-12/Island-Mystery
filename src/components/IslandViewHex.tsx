import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import islandHex from "@/assets/island-hex.jpg";
import farmIcon from "@/assets/farm-icon.jpg";
import mineIcon from "@/assets/mine-icon.jpg";
import defenseIcon from "@/assets/defense-icon.jpg";
import troopIcon from "@/assets/troop-icon.jpg";
import wheatIcon from "@/assets/wheat-icon.jpg";
import goldIcon from "@/assets/gold-icon.jpg";

interface Hex {
  id: string;
  position: { x: number; y: number };
  isUnlocked: boolean;
  building: Building | null;
}

interface Building {
  type: "farm" | "mine" | "defense" | "troop";
  level: number;
}

interface Island {
  id: string;
  name: string;
  owner: string;
  isPlayer: boolean;
  position: { x: number; y: number };
}

interface IslandViewHexProps {
  island: Island;
  onBack: () => void;
}

const BUILDING_TYPES = [
  { 
    type: "farm" as const, 
    name: "Farm", 
    icon: farmIcon,
    cost: { wheat: 5, gold: 5 },
    production: { wheat: 5, gold: 0 },
    description: "Produces 5 Wheat daily"
  },
  { 
    type: "mine" as const, 
    name: "Mine", 
    icon: mineIcon,
    cost: { wheat: 5, gold: 5 },
    production: { wheat: 0, gold: 5 },
    description: "Produces 5 Gold daily"
  },
  { 
    type: "defense" as const, 
    name: "Defense Tower", 
    icon: defenseIcon,
    cost: { wheat: 0, gold: 30 },
    production: { wheat: 0, gold: 0 },
    description: "+10 Defense Power"
  },
  { 
    type: "troop" as const, 
    name: "Troop Camp", 
    icon: troopIcon,
    cost: { wheat: 0, gold: 30 },
    production: { wheat: 0, gold: 0 },
    description: "+10 Attack Power"
  },
];

// Generate hexagonal pattern: 3-4-4-4-3 formation (18 total hexes)
const generateHexes = (): Hex[] => {
  const hexes: Hex[] = [];
  const rows = [
    { count: 3, startX: 1.5 },  // Top row - 3 hexes
    { count: 4, startX: 1 },    // Second row - 4 hexes
    { count: 4, startX: 1 },    // Third row - 4 hexes (with gap in middle)
    { count: 4, startX: 1 },    // Fourth row - 4 hexes
    { count: 3, startX: 1.5 }   // Bottom row - 3 hexes
  ];

  let hexId = 0;
  rows.forEach((row, rowIndex) => {
    for (let col = 0; col < row.count; col++) {
      // Skip middle positions in the third row to create the gap
      if (rowIndex === 2 && (col === 1 || col === 2)) {
        continue;
      }
      
      const id = `hex-${hexId++}`;
      // Center hexes are unlocked initially
      const isUnlocked = rowIndex >= 1 && rowIndex <= 3 && col >= 1 && col <= 2;
      
      hexes.push({
        id,
        position: { x: row.startX + col, y: rowIndex },
        isUnlocked,
        building: null,
      });
    }
  });
  
  return hexes;
};

export default function IslandViewHex({ island, onBack }: IslandViewHexProps) {
  const [hexes, setHexes] = useState<Hex[]>(generateHexes());
  const [selectedBuildingType, setSelectedBuildingType] = useState<Building["type"] | null>(null);
  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  
  // Hardcoded player resources
  const [resources, setResources] = useState({ wheat: 50, gold: 100 });
  const [stats, setStats] = useState({ attack: 20, defense: 30 });

  const handleHexClick = (hex: Hex) => {
    if (!hex.isUnlocked) return;
    
    if (selectedBuildingType && !hex.building) {
      const buildingType = BUILDING_TYPES.find(bt => bt.type === selectedBuildingType);
      if (!buildingType) return;
      
      // Check if player has enough resources
      if (resources.wheat >= buildingType.cost.wheat && resources.gold >= buildingType.cost.gold) {
        // Place building
        setHexes(prevHexes =>
          prevHexes.map(h =>
            h.id === hex.id
              ? { ...h, building: { type: selectedBuildingType, level: 1 } }
              : h
          )
        );
        
        // Deduct resources
        setResources(prev => ({
          wheat: prev.wheat - buildingType.cost.wheat,
          gold: prev.gold - buildingType.cost.gold
        }));
        
        // Update stats if it's attack/defense building
        if (selectedBuildingType === 'defense') {
          setStats(prev => ({ ...prev, defense: prev.defense + 10 }));
        } else if (selectedBuildingType === 'troop') {
          setStats(prev => ({ ...prev, attack: prev.attack + 10 }));
        }
        
        setSelectedBuildingType(null);
      }
    } else {
      setSelectedHex(hex.id);
    }
  };

  const getBuildingTypeInfo = (buildingType: Building["type"]) => {
    return BUILDING_TYPES.find(bt => bt.type === buildingType);
  };

  const canAfford = (buildingType: Building["type"]) => {
    const building = BUILDING_TYPES.find(bt => bt.type === buildingType);
    if (!building) return false;
    return resources.wheat >= building.cost.wheat && resources.gold >= building.cost.gold;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm" className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Button>
          <Card className="bg-black/50 backdrop-blur-sm border-white/20">
            <div className="px-4 py-2">
              <h1 className="text-xl font-bold text-white">{island.name}</h1>
              <p className="text-sm text-white/80">Owner: {island.owner}</p>
            </div>
          </Card>
        </div>
        
        {/* Resource Display */}
        <div className="flex gap-4">
          <Card className="bg-black/50 backdrop-blur-sm border-white/20">
            <div className="px-4 py-2 flex items-center gap-2">
              <img src={wheatIcon} alt="Wheat" className="w-6 h-6 rounded" />
              <span className="text-white font-semibold">{resources.wheat}</span>
            </div>
          </Card>
          <Card className="bg-black/50 backdrop-blur-sm border-white/20">
            <div className="px-4 py-2 flex items-center gap-2">
              <img src={goldIcon} alt="Gold" className="w-6 h-6 rounded" />
              <span className="text-white font-semibold">{resources.gold}</span>
            </div>
          </Card>
          <Card className="bg-black/50 backdrop-blur-sm border-white/20">
            <div className="px-4 py-2">
              <p className="text-sm text-white">⚔️ {stats.attack} | 🛡️ {stats.defense}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Building Selection */}
      <Card className="mb-6 bg-black/50 backdrop-blur-sm border-white/20">
        <div className="p-4">
          <h3 className="font-semibold text-white mb-3">Select Building to Place</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BUILDING_TYPES.map((buildingType) => {
              const affordable = canAfford(buildingType.type);
              return (
                <Button
                  key={buildingType.type}
                  variant={selectedBuildingType === buildingType.type ? "default" : "outline"}
                  className={`flex flex-col gap-2 h-auto p-3 ${
                    selectedBuildingType === buildingType.type 
                      ? "bg-primary hover:bg-primary/80" 
                      : affordable 
                        ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                        : "bg-red-900/20 border-red-500/30 text-red-300 cursor-not-allowed"
                  }`}
                  disabled={!affordable}
                  onClick={() => setSelectedBuildingType(
                    selectedBuildingType === buildingType.type ? null : buildingType.type
                  )}
                >
                  <img src={buildingType.icon} alt={buildingType.name} className="w-8 h-8 rounded" />
                  <div className="text-xs text-center">
                    <div className="font-semibold">{buildingType.name}</div>
                    <div className="text-xs opacity-80">
                      {buildingType.cost.wheat > 0 && `${buildingType.cost.wheat}🌾`}
                      {buildingType.cost.wheat > 0 && buildingType.cost.gold > 0 && " "}
                      {buildingType.cost.gold > 0 && `${buildingType.cost.gold}🪙`}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Island View */}
      <div className="flex justify-center">
        <Card className="p-8 bg-black/30 backdrop-blur-sm border-white/20 shadow-2xl">
          <div 
            className="relative w-96 h-96 bg-cover bg-center rounded-lg overflow-hidden"
            style={{ backgroundImage: `url(${islandHex})` }}
          >
            {/* Hexagonal Grid Overlay */}
            <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 gap-1 p-4">
              {hexes.map((hex, index) => {
                const row = Math.floor(index / 5);
                const col = index % 5;
                
                // Calculate position based on hexagonal pattern
                let gridColumn = col + 1;
                let gridRow = row + 1;
                
                // Adjust for hexagonal layout
                if (row === 0) gridColumn = col + 2; // Top row (3 hexes centered)
                if (row === 4) gridColumn = col + 2; // Bottom row (3 hexes centered)
                
                return (
                  <div
                    key={hex.id}
                    className={`
                      relative cursor-pointer transition-all duration-200 transform hover:scale-110
                      ${hex.isUnlocked
                        ? hex.building
                          ? "opacity-100"
                          : selectedBuildingType
                            ? "bg-accent/40 border-2 border-accent rounded-lg"
                            : "bg-white/20 border-2 border-white/40 rounded-lg"
                        : "opacity-30 cursor-not-allowed"
                      }
                      ${selectedHex === hex.id ? "ring-2 ring-primary" : ""}
                    `}
                    style={{
                      gridColumn: gridColumn,
                      gridRow: gridRow,
                      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    }}
                    onClick={() => handleHexClick(hex)}
                  >
                    <div className="w-full h-full flex items-center justify-center bg-white/10 backdrop-blur-sm">
                      {hex.building ? (
                        <div className="text-center">
                          <img 
                            src={getBuildingTypeInfo(hex.building.type)?.icon} 
                            alt={getBuildingTypeInfo(hex.building.type)?.name}
                            className="w-8 h-8 rounded mx-auto mb-1"
                          />
                          <div className="text-xs font-bold text-white bg-black/50 rounded px-1">
                            L{hex.building.level}
                          </div>
                        </div>
                      ) : hex.isUnlocked ? (
                        <Plus className="w-6 h-6 text-white/80" />
                      ) : (
                        <div className="text-lg">🔒</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Production Summary */}
      <Card className="mt-6 bg-black/50 backdrop-blur-sm border-white/20">
        <div className="p-4">
          <h3 className="font-semibold text-white mb-3">Daily Production</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
            <div className="text-center">
              <img src={wheatIcon} alt="Wheat" className="w-8 h-8 rounded mx-auto mb-1" />
              <div className="text-lg font-bold">+25</div>
              <div className="text-xs opacity-80">Wheat/day</div>
            </div>
            <div className="text-center">
              <img src={goldIcon} alt="Gold" className="w-8 h-8 rounded mx-auto mb-1" />
              <div className="text-lg font-bold">+15</div>
              <div className="text-xs opacity-80">Gold/day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">⚔️</div>
              <div className="text-lg font-bold">{stats.attack}</div>
              <div className="text-xs opacity-80">Attack Power</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🛡️</div>
              <div className="text-lg font-bold">{stats.defense}</div>
              <div className="text-xs opacity-80">Defense Power</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="mt-4 bg-black/50 backdrop-blur-sm border-white/20">
        <div className="p-4">
          <h3 className="font-semibold text-white mb-2">Instructions</h3>
          <div className="text-sm text-white/80 space-y-1">
            <p>• Select a building type above, then click on an empty unlocked hex to place it</p>
            <p>• Locked hexes (🔒) can be purchased for 50 Gold each to expand your island</p>
            <p>• Build farms and mines for daily resource production</p>
            <p>• Build defense towers and troop camps to increase your combat stats</p>
          </div>
        </div>
      </Card>
    </div>
  );
}