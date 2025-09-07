"use client"

import { useState, useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sky, Environment } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import * as THREE from "three"

interface PVPBattleScreenProps {
  onBack: () => void
  onVictory: () => void // Made onVictory required instead of optional
}

function Cannonball({
  startPosition,
  targetPosition,
  onHit,
  isActive,
}: {
  startPosition: [number, number, number]
  targetPosition: [number, number, number]
  onHit: () => void
  isActive: boolean
}) {
  const ballRef = useRef<THREE.Mesh>(null!)
  const [progress, setProgress] = useState(0)

  useFrame((state, delta) => {
    if (!isActive || !ballRef.current) return

    const newProgress = progress + delta * 0.8 // Adjust speed here
    setProgress(newProgress)

    if (newProgress >= 1) {
      onHit()
      return
    }

    // Parabolic trajectory calculation
    const t = newProgress
    const x = THREE.MathUtils.lerp(startPosition[0], targetPosition[0], t)
    const z = THREE.MathUtils.lerp(startPosition[2], targetPosition[2], t)
    const maxHeight = 8 // Peak height of cannonball arc
    const y =
      startPosition[1] + 4 * maxHeight * t * (1 - t) + THREE.MathUtils.lerp(startPosition[1], targetPosition[1], t)

    ballRef.current.position.set(x, y, z)
  })

  if (!isActive) return null

  return (
    <mesh ref={ballRef} position={startPosition}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial color="#2C1810" metalness={0.8} roughness={0.3} />
    </mesh>
  )
}

function Explosion({ position, isActive }: { position: [number, number, number]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null!)
  const [scale, setScale] = useState(0)

  useFrame((state, delta) => {
    if (!isActive || !groupRef.current) return

    const newScale = scale + delta * 8
    setScale(newScale)
    groupRef.current.scale.setScalar(Math.min(newScale, 3))

    if (newScale > 2) {
      const opacity = Math.max(0, 1 - (newScale - 2))
      groupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
          ;(child.material as any).opacity = opacity
        }
      })
    }
  })

  if (!isActive) return null

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#FF6B35" transparent opacity={0.8} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshBasicMaterial color="#FFD23F" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

function Ship({
  position,
  color,
  isPlayer = false,
  isHit = false, // Added hit state for visual feedback
}: { position: [number, number, number]; color: string; isPlayer?: boolean; isHit?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!)
  const [shipPosition, setShipPosition] = useState(position)
  const [velocity, setVelocity] = useState(0)

  useFrame((state, delta) => {
    if (groupRef.current) {
      const hitOffset = isHit ? Math.sin(state.clock.elapsedTime * 10) * 0.3 : 0
      groupRef.current.position.y =
        shipPosition[1] +
        Math.sin(state.clock.elapsedTime * 1.5) * 0.15 +
        Math.cos(state.clock.elapsedTime * 0.8) * 0.1 +
        hitOffset
      groupRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 1.2) * 0.05 + (isHit ? Math.sin(state.clock.elapsedTime * 8) * 0.1 : 0)
      groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.9) * 0.03
    }
  })

  useState(() => {
    if (isPlayer) {
      const handleKeyPress = (event: KeyboardEvent) => {
        const moveSpeed = 0.3
        let moved = false
        switch (event.key.toLowerCase()) {
          case "w":
          case "arrowup":
            setShipPosition((prev) => [prev[0], prev[1], Math.max(prev[2] - moveSpeed, -12)])
            moved = true
            break
          case "s":
          case "arrowdown":
            setShipPosition((prev) => [prev[0], prev[1], Math.min(prev[2] + moveSpeed, 12)])
            moved = true
            break
          case "a":
          case "arrowleft":
            setShipPosition((prev) => [Math.max(prev[0] - moveSpeed, -12), prev[1], prev[2]])
            moved = true
            break
          case "d":
          case "arrowright":
            setShipPosition((prev) => [Math.min(prev[0] + moveSpeed, 12), prev[1], prev[2]])
            moved = true
            break
        }
        if (moved) {
          setVelocity(moveSpeed * 10)
          setTimeout(() => setVelocity(0), 500)
        }
      }

      window.addEventListener("keydown", handleKeyPress)
      return () => window.removeEventListener("keydown", handleKeyPress)
    }
  })

  return (
    <group ref={groupRef} position={shipPosition}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 0.8, 4, 16]} />
        <meshStandardMaterial color={isHit ? "#8B0000" : color} metalness={0.4} roughness={0.6} envMapIntensity={0.8} />
      </mesh>

      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1.1, 1.1, 0.2, 16]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} metalness={0.1} />
      </mesh>

      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 4]} />
        <meshStandardMaterial color="#654321" roughness={0.9} />
      </mesh>

      <mesh position={[0.3, 2.8, -0.8]} castShadow>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#F5F5DC" side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>

      <mesh position={[0, 2, 1.8]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 2.5]} />
        <meshStandardMaterial color="#654321" roughness={0.9} />
      </mesh>

      <mesh position={[0.2, 2.2, 1.2]} castShadow>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshStandardMaterial color="#F5F5DC" side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>

      <mesh position={[0, 1, 1.5]} castShadow>
        <boxGeometry args={[1.2, 0.8, 1]} />
        <meshStandardMaterial color="#8B4513" roughness={0.7} />
      </mesh>

      <mesh position={[1.2, 0.7, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.15, 0.12, 1.2]} />
        <meshStandardMaterial color="#CD7F32" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-1.2, 0.7, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.15, 0.12, 1.2]} />
        <meshStandardMaterial color="#CD7F32" metalness={0.8} roughness={0.3} />
      </mesh>

      <mesh position={[0, 4.2, 0]} castShadow>
        <planeGeometry args={[0.8, 0.5]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      <mesh position={[0, 1.5, -0.5]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 3]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  )
}

function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const oceanShader = useMemo(
    () => ({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color("#1e40af") },
        color2: { value: new THREE.Color("#0f172a") },
        color3: { value: new THREE.Color("#0ea5e9") },
      },
      vertexShader: `
      uniform float time;
      varying vec2 vUv;
      varying float vElevation;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        
        float elevation = 0.0;
        elevation += sin(modelPosition.x * 0.2 + time * 1.5) * 0.4;
        elevation += sin(modelPosition.z * 0.15 + time * 1.2) * 0.3;
        elevation += sin(modelPosition.x * 0.05 + modelPosition.z * 0.05 + time * 0.8) * 0.6;
        elevation += sin(modelPosition.x * 0.3 + modelPosition.z * 0.2 + time * 2.0) * 0.2;
        elevation += cos(modelPosition.x * 0.1 + time * 1.8) * 0.25;
        
        modelPosition.y += elevation;
        vElevation = elevation;
        
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        
        gl_Position = projectedPosition;
      }
    `,
      fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;
      uniform float time;
      varying vec2 vUv;
      varying float vElevation;
      varying vec3 vPosition;
      
      void main() {
        float foam = smoothstep(0.3, 0.6, vElevation);
        float depth = smoothstep(-0.5, 0.0, vElevation);
        
        vec3 deepColor = color2;
        vec3 surfaceColor = color1;
        vec3 foamColor = color3;
        
        vec3 color = mix(deepColor, surfaceColor, depth);
        color = mix(color, foamColor, foam * 0.6);
        
        // Add some sparkle effect
        float sparkle = sin(vPosition.x * 50.0 + time * 3.0) * sin(vPosition.z * 50.0 + time * 2.0);
        sparkle = smoothstep(0.8, 1.0, sparkle) * 0.3;
        color += sparkle;
        
        gl_FragColor = vec4(color, 0.85);
      }
    `,
    }),
    [],
  )

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[200, 200, 256, 256]} />
        <shaderMaterial ref={materialRef} {...oceanShader} transparent side={THREE.DoubleSide} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <planeGeometry args={[300, 300, 128, 128]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.6} roughness={0.1} metalness={0.8} />
      </mesh>
    </>
  )
}

export default function PVPBattleScreen({ onBack, onVictory }: PVPBattleScreenProps) {
  const [playerVelocity, setPlayerVelocity] = useState(0)
  const [distance, setDistance] = useState(12.5)

  const [azimuthalAngle, setAzimuthalAngle] = useState([45])
  const [verticalAngle, setVerticalAngle] = useState([45])
  const [cannonVelocity, setCannonVelocity] = useState([75])
  const [isFiring, setIsFiring] = useState(false)
  const [showExplosion, setShowExplosion] = useState(false)
  const [enemyHit, setEnemyHit] = useState(false)
  const [showVictory, setShowVictory] = useState(false)

  const handleFireCannon = () => {
    if (isFiring) return

    console.log("[v0] Firing cannon with angles:", {
      azimuthal: azimuthalAngle[0],
      vertical: verticalAngle[0],
      velocity: cannonVelocity[0],
    })
    setIsFiring(true)
  }

  const handleCannonballHit = () => {
    console.log("[v0] Cannonball hit target!")
    setIsFiring(false)
    setShowExplosion(true)
    setEnemyHit(true)

    setTimeout(() => {
      setShowExplosion(false)
      setShowVictory(true)
    }, 2000)
  }

  const handleBackToMenu = () => {
    onVictory()
  }

  if (showVictory) {
    return (
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center">
        <div className="text-center space-y-8 animate-pulse">
          <h1 className="text-8xl font-bold text-white drop-shadow-2xl animate-bounce">🎉 VICTORY! 🎉</h1>
          <p className="text-3xl text-white font-semibold drop-shadow-lg">You sunk the enemy ship with your cannon!</p>
          <div className="space-y-4">
            <p className="text-xl text-white/90">
              Final Shot: {azimuthalAngle[0]}° azimuth, {verticalAngle[0]}° elevation
            </p>
            <Button
              onClick={handleBackToMenu}
              size="lg"
              className="px-12 py-6 text-2xl font-bold bg-white text-orange-600 hover:bg-gray-100 shadow-2xl"
            >
              Return to Main Menu
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-blue-900">
      <Canvas camera={{ position: [0, 15, 20], fov: 75 }} shadows gl={{ antialias: true, alpha: false }}>
        <Sky sunPosition={[100, 20, 100]} />
        <Environment preset="sunset" />
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[20, 30, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={100}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        <pointLight position={[0, 15, 0]} intensity={0.4} color="#87CEEB" />
        <hemisphereLight args={["#87CEEB", "#1e40af", 0.6]} />

        <Ocean />

        <Ship position={[-8, 0, 0]} color="#3B82F6" isPlayer={true} />
        <Ship position={[8, 0, 0]} color="#EF4444" isHit={enemyHit} />

        <Cannonball
          startPosition={[-8, 2, 0]}
          targetPosition={[8, 2, 0]}
          onHit={handleCannonballHit}
          isActive={isFiring}
        />

        <Explosion position={[8, 2, 0]} isActive={showExplosion} />

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          maxDistance={40}
          minDistance={8}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>

      <div className="absolute top-4 right-4 space-y-4">
        <Card className="p-6 bg-black/90 backdrop-blur-sm border-yellow-400/50 border-2 min-w-[320px] shadow-2xl">
          <h3 className="text-yellow-400 font-bold text-xl mb-4 text-center">🎯 CANNON CONTROLS</h3>

          <div className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium block mb-2">
                Azimuthal Angle: <span className="text-yellow-400 font-bold">{azimuthalAngle[0]}°</span>
              </label>
              <Slider
                value={azimuthalAngle}
                onValueChange={setAzimuthalAngle}
                max={90}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium block mb-2">
                Vertical Angle: <span className="text-yellow-400 font-bold">{verticalAngle[0]}°</span>
              </label>
              <Slider
                value={verticalAngle}
                onValueChange={setVerticalAngle}
                max={90}
                min={10}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium block mb-2">
                Velocity: <span className="text-yellow-400 font-bold">{cannonVelocity[0]} m/s</span>
              </label>
              <Slider
                value={cannonVelocity}
                onValueChange={setCannonVelocity}
                max={100}
                min={25}
                step={5}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleFireCannon}
              disabled={isFiring}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-bold py-4 text-xl shadow-lg transform hover:scale-105 transition-all"
            >
              {isFiring ? "🔥 FIRING..." : "🔥 FIRE CANNON!"}
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-black/70 backdrop-blur-sm border-white/20">
          <div className="text-white space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Velocity:</span>
              <span className="text-blue-400 font-bold">{playerVelocity.toFixed(1)} knots</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Distance:</span>
              <span className="text-green-400 font-bold">{distance.toFixed(1)} nautical miles</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="absolute bottom-4 left-4">
        <Card className="p-4 bg-black/50 backdrop-blur-sm border-white/20">
          <div className="text-white text-sm space-y-1">
            <p className="font-bold mb-2">Controls:</p>
            <p>WASD or Arrow Keys - Move Ship</p>
            <p>Mouse - Camera Control</p>
            <p className="text-yellow-400">🎯 Use cannon controls to fire!</p>
          </div>
        </Card>
      </div>

      <div className="absolute top-4 left-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="bg-black/50 backdrop-blur-sm text-white border-white/30 hover:bg-white/20"
        >
          Back to Menu
        </Button>
      </div>
    </div>
  )
}
