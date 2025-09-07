"use client"

import { useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Cloud, Sky } from "@react-three/drei"
import { Button } from "@/components/ui/button"

interface PVPWaitingScreenProps {
  onPlayerConnected: () => void
  onBack: () => void
}

function Clouds() {
  return (
    <>
      <Cloud position={[-4, 2, -8]} speed={0.2} opacity={0.8} />
      <Cloud position={[4, 1, -6]} speed={0.3} opacity={0.6} />
      <Cloud position={[0, 3, -10]} speed={0.1} opacity={0.7} />
      <Cloud position={[-2, 0, -4]} speed={0.25} opacity={0.5} />
      <Cloud position={[6, 2.5, -12]} speed={0.15} opacity={0.9} />
    </>
  )
}

export default function PVPWaitingScreen({ onPlayerConnected, onBack }: PVPWaitingScreenProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    const connectionTimer = setTimeout(() => {
      onPlayerConnected()
    }, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(connectionTimer)
    }
  }, [onPlayerConnected])

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Clouds />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>

      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold text-white drop-shadow-2xl">PVP MODE</h1>

          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <p className="text-2xl text-white font-medium">Waiting for other player to connect{dots}</p>
            <div className="mt-4 w-64 h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="px-8 py-4 text-lg font-semibold bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/50 backdrop-blur-sm"
          >
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  )
}
