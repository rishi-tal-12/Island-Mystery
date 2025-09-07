"use client"

import { Button } from "@/components/ui/button"
import oceanBackground from "@/assets/ocean-background.jpg"

interface LandingScreenProps {
  onEnterGame: () => void
  onHowToPlay: () => void
  onPVPMode: () => void
}

export default function LandingScreen({ onEnterGame, onHowToPlay, onPVPMode }: LandingScreenProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      {/* Ocean Background */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${oceanBackground})` }} />

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />

      {/* Main Content */}
      <div className="relative z-10 text-center space-y-8 animate-fade-in">
        {/* Game Title */}
        <div className="space-y-4">
          <h1 className="text-8xl font-bold text-white drop-shadow-2xl tracking-wider font-serif">ARLAND</h1>
          <p className="text-2xl text-accent drop-shadow-lg font-medium">Blockchain Island Strategy</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 items-center mt-12">
          <Button
            onClick={onEnterGame}
            size="lg"
            className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-2xl border-2 border-primary/50 hover:scale-105 transition-all duration-300"
          >
            Enter Game
          </Button>

          <Button
            onClick={onPVPMode}
            size="lg"
            className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-2xl border-2 border-red-400/50 hover:scale-105 transition-all duration-300"
          >
            PVP Mode
          </Button>

          <Button
            onClick={onHowToPlay}
            variant="outline"
            size="lg"
            className="px-8 py-4 text-lg font-semibold bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/50 backdrop-blur-sm hover:scale-105 transition-all duration-300"
          >
            How to Play
          </Button>
        </div>

        {/* Subtitle */}
        <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed mt-8">
          Build your island empire, manage resources, and conquer the seas in this blockchain-powered strategy game
        </p>
      </div>

      {/* Floating Islands Animation */}
      <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-accent/20 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-primary/20 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/3 left-1/3 w-20 h-20 bg-secondary/20 rounded-full animate-pulse delay-2000"></div>
    </div>
  )
}
