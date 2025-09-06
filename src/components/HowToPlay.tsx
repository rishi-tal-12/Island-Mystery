import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Coins, Wheat, Shield, Sword } from "lucide-react";
import woodenBg from "@/assets/wooden-bg.jpg";

interface HowToPlayProps {
  onBack: () => void;
}

export default function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-4">
      {/* Back Button */}
      <div className="mb-6">
        <Button onClick={onBack} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Button>
      </div>

      {/* Main Content Container with Wooden Background */}
      <div className="max-w-4xl mx-auto">
        <Card 
          className="p-8 bg-cover bg-center shadow-2xl border-4 border-amber-800/50"
          style={{ backgroundImage: `url(${woodenBg})` }}
        >
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 text-white">
            {/* Title */}
            <h1 className="text-4xl font-bold text-center mb-8 text-accent">
              Welcome to Arland
            </h1>

            {/* What's the Game Section */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary">What's the Game?</h2>
              <p className="text-lg leading-relaxed">
                Arland is a blockchain-powered island strategy game where each player owns an island as a smart contract. 
                You start with Wheat and Gold, build farms, mines, and defenses, and expand your land. Using Chainlink for 
                daily cycles, you can trade with others, attack rival islands to steal resources, and strategically grow to 
                dominate the world map.
              </p>
            </section>

            {/* How to Play Section */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary">How to Play</h2>
              <p className="text-lg leading-relaxed mb-6">
                Enter the game to get your island, use resources to build or expand, manage daily production, and choose 
                whether to trade peacefully or attack opponents to strengthen your empire.
              </p>

              {/* Game Mechanics Grid */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Starting Resources */}
                <Card className="p-4 bg-gradient-to-br from-amber-900/80 to-amber-700/60 border-amber-600">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Starting Resources
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Wheat className="w-4 h-4" />
                      10 Wheat - For building and feeding troops
                    </li>
                    <li className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      5 Gold - For purchasing advanced structures
                    </li>
                  </ul>
                </Card>

                {/* Building Types */}
                <Card className="p-4 bg-gradient-to-br from-green-900/80 to-green-700/60 border-green-600">
                  <h3 className="text-xl font-semibold mb-3">Building Types</h3>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Farm:</strong> Produces 5 Wheat daily (Cost: 5 Wheat + 5 Gold)</li>
                    <li><strong>Mine:</strong> Produces 5 Gold daily (Cost: 5 Wheat + 5 Gold)</li>
                    <li><strong>Defense:</strong> +10 Defense (Cost: 30 Gold)</li>
                    <li><strong>Troop Camp:</strong> +10 Attack (Cost: 30 Gold)</li>
                  </ul>
                </Card>

                {/* Combat System */}
                <Card className="p-4 bg-gradient-to-br from-red-900/80 to-red-700/60 border-red-600">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Sword className="w-5 h-5" />
                    Combat & Trading
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>Attack islands with weaker defenses</li>
                    <li>Steal 50% of enemy resources if successful</li>
                    <li>Both players pay 15 Wheat recharge cost</li>
                    <li>Trade peacefully to exchange resources</li>
                  </ul>
                </Card>

                {/* Expansion */}
                <Card className="p-4 bg-gradient-to-br from-blue-900/80 to-blue-700/60 border-blue-600">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Island Expansion
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>Purchase additional land for 50 Gold per hex</li>
                    <li>Maximum 18 hexes per island</li>
                    <li>Strategic hex placement for optimal defense</li>
                    <li>Daily cycles powered by Chainlink automation</li>
                  </ul>
                </Card>
              </div>
            </section>

            {/* Strategy Tips */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">Strategy Tips</h2>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gradient-to-b from-primary/20 to-primary/10 p-3 rounded border border-primary/30">
                  <strong className="text-primary">Early Game:</strong> Build farms and mines to establish steady resource income
                </div>
                <div className="bg-gradient-to-b from-accent/20 to-accent/10 p-3 rounded border border-accent/30">
                  <strong className="text-accent">Mid Game:</strong> Expand your territory and build defensive structures
                </div>
                <div className="bg-gradient-to-b from-secondary/20 to-secondary/10 p-3 rounded border border-secondary/30">
                  <strong className="text-secondary">Late Game:</strong> Build troop camps and raid weaker islands for resources
                </div>
              </div>
            </section>

            {/* Enter Game Button */}
            <div className="text-center mt-8">
              <Button 
                onClick={onBack}
                size="lg"
                className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Ready to Play!
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}