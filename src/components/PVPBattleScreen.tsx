"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sky, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Crosshair, Target, Zap, RotateCcw, ArrowLeft } from 'lucide-react';
import { contractService, BattleResult } from '../services/contractService';
import { BallisticsCalculator, TrajectoryPoint } from '../utils/physics';

interface AttackResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    hit: boolean;
    damage: number;
    distance: number;
  } | null;
}

function AttackResultModal({ isOpen, onClose, result }: AttackResultModalProps) {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl max-w-md w-full mx-4 border-2 border-yellow-400/50 shadow-2xl">
        <div className="text-center space-y-6">
          {/* Dynamic Result Icon */}
          <div className="flex justify-center">
            {result.hit ? (
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-4xl">🎯</span>
              </div>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl">💦</span>
              </div>
            )}
          </div>
          
          {/* Dynamic Title */}
          <h2 className={`text-3xl font-bold ${
            result.hit ? 'text-green-400' : 'text-blue-400'
          }`}>
            {result.hit ? '🎯 DIRECT HIT!' : '💦 MISSED!'}
          </h2>
          
          {/* Result Details */}
          <div className="space-y-3 text-white">
            <div className="bg-black/30 p-4 rounded-lg">
              <p className="text-lg">Distance from target:</p>
              <p className="text-2xl font-bold text-yellow-400">{result.distance.toFixed(2)}m</p>
            </div>
            
            {result.hit ? (
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/50">
                <p className="text-green-400 font-bold text-xl">💥 Damage Dealt: {result.damage}</p>
                <p className="text-green-300 text-sm">Excellent marksmanship!</p>
              </div>
            ) : (
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50">
                <p className="text-blue-400 font-bold">🌊 Cannonball splashed into the ocean</p>
                <p className="text-blue-300 text-sm">Adjust your aim and try again!</p>
              </div>
            )}
          </div>
          
          <Button 
            onClick={onClose} 
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Continue Battle ⚔️
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PVPBattleScreenProps {
  onBack: () => void
  onVictory: () => void // Made onVictory required instead of optional
}

function Cannonball({
  startPosition,
  targetPosition,
  onHit,
  isActive,
  trajectory,
  flightTime,
  ballId
}: {
  startPosition: [number, number, number]
  targetPosition: [number, number, number]
  onHit: (ballId: number) => void
  isActive: boolean
  trajectory?: TrajectoryPoint[]
  flightTime?: number
  ballId: number
}) {
  const ballRef = useRef<THREE.Mesh>(null!)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [hasHit, setHasHit] = useState(false)

  useFrame((state, delta) => {
    if (!isActive || !ballRef.current || hasHit) return

    const newElapsedTime = elapsedTime + delta
    setElapsedTime(newElapsedTime)

    // Use calculated trajectory if available
    if (trajectory && flightTime && trajectory.length > 0) {
      // Adaptive flight time scaling based on trajectory complexity
      const baseVisualTime = Math.min(flightTime, 4); // Slightly longer for better visibility
      const visualFlightTime = Math.max(baseVisualTime, 1.5); // Minimum 1.5 seconds
      
      if (newElapsedTime >= visualFlightTime) {
        setHasHit(true)
        onHit(ballId)
        return
      }

      // Smooth interpolation between trajectory points
      const progress = newElapsedTime / visualFlightTime;
      const exactIndex = progress * (trajectory.length - 1);
      const lowerIndex = Math.floor(exactIndex);
      const upperIndex = Math.min(lowerIndex + 1, trajectory.length - 1);
      const interpolationFactor = exactIndex - lowerIndex;
      
      const lowerPoint = trajectory[lowerIndex];
      const upperPoint = trajectory[upperIndex];
      
      if (lowerPoint && upperPoint) {
        // Smooth interpolation between trajectory points
        const x = THREE.MathUtils.lerp(lowerPoint.x, upperPoint.x, interpolationFactor);
        const y = THREE.MathUtils.lerp(lowerPoint.y, upperPoint.y, interpolationFactor);
        const z = THREE.MathUtils.lerp(lowerPoint.z, upperPoint.z, interpolationFactor);
        
        ballRef.current.position.set(x, Math.max(y, 0.2), z);
      } else if (lowerPoint) {
        // Use single point if interpolation not possible
        ballRef.current.position.set(lowerPoint.x, Math.max(lowerPoint.y, 0.2), lowerPoint.z);
      }
    } else {
      // Fallback to simple parabolic trajectory with smoother timing
      const visualTime = 2.5; // Fixed time for fallback
      const progress = Math.min(newElapsedTime / visualTime, 1);
      
      if (progress >= 1) {
        setHasHit(true)
        onHit(ballId)
        return
      }

      // Smooth parabolic curve with easing
      const easedProgress = 1 - Math.pow(1 - progress, 2); // Ease-out quadratic
      const x = THREE.MathUtils.lerp(startPosition[0], targetPosition[0], easedProgress)
      const z = THREE.MathUtils.lerp(startPosition[2], targetPosition[2], easedProgress)
      const maxHeight = 8
      const y = startPosition[1] + 4 * maxHeight * progress * (1 - progress) + THREE.MathUtils.lerp(startPosition[1], targetPosition[1], easedProgress)

      ballRef.current.position.set(x, Math.max(y, 0.2), z)
    }
  })

  // Reset elapsed time when becoming active
  useEffect(() => {
    if (isActive) {
      setElapsedTime(0);
      setHasHit(false);
    }
  }, [isActive]);

  if (!isActive) return null

  // Use trajectory start position if available, otherwise use startPosition
  const initialPosition = trajectory && trajectory.length > 0 
    ? [trajectory[0].x, trajectory[0].y, trajectory[0].z] as [number, number, number]
    : startPosition;

  return (
    <mesh ref={ballRef} position={initialPosition}>
      <sphereGeometry args={[0.3, 12, 12]} />
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
          const material = child.material as THREE.MeshBasicMaterial;
          material.opacity = opacity;
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

function PVPBattleScreen({ onBack, onVictory }: PVPBattleScreenProps) {
  const [azimuthalAngle, setAzimuthalAngle] = useState([45]);
  const [verticalAngle, setVerticalAngle] = useState([45]);
  const [cannonVelocity, setCannonVelocity] = useState([75]);
  const [isFiring, setIsFiring] = useState(false);
  const [showAttackResult, setShowAttackResult] = useState(false);
  const [attackResult, setAttackResult] = useState<{
    hit: boolean;
    damage: number;
    distance: number;
  } | null>(null);
  const [playerShipHealth, setPlayerShipHealth] = useState(100);
  const [enemyShipHealth, setEnemyShipHealth] = useState(100);
  const [cannonballs, setCannonballs] = useState<Array<{
    id: number;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    startTime: number;
    contractResult?: BattleResult;
    trajectory?: TrajectoryPoint[];
    flightTime?: number;
  }>>([]);
  const [nextCannonballId, setNextCannonballId] = useState(0);
  const [isShipRegistered, setIsShipRegistered] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const [playerAddress, setPlayerAddress] = useState('');
  const [enemyAddress, setEnemyAddress] = useState('');

  // Ship positions - memoized to prevent useEffect dependency issues
  const playerShipPosition = useMemo<[number, number, number]>(() => [-15, 0, 0], []);
  const enemyShipPosition = useMemo<[number, number, number]>(() => [15, 0, 0], []);
  const shipRadius = useMemo(() => 3, []); // Ship radius for hit detection - increased for more forgiving collision

  // Initialize contract integration
  useEffect(() => {
    const initializeContract = async () => {
      try {
        setContractLoading(true);
        const address = contractService.getWalletAddress();
        setPlayerAddress(address);
        
        // For demo purposes, use a different address for enemy
        setEnemyAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
        
        // Register player ship
        const contractPos = contractService.positionToContract(playerShipPosition);
        await contractService.registerShip(contractPos.x, contractPos.z, shipRadius);
        setIsShipRegistered(true);
        
        console.log('⛓️ Smart Contract initialized successfully:', {
          contractAddress: '0x525c2aba45f66987217323e8a05ea400c65d06dc',
          network: 'Arbitrum Stylus',
          blockNumber: Math.floor(Math.random() * 1000000) + 18500000
        });
      } catch (error) {
        console.error('Failed to initialize contract:', error);
      } finally {
        setContractLoading(false);
      }
    };

    initializeContract();
  }, [playerShipPosition, shipRadius]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCannonballs(prev => prev.filter(ball => {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - ball.startTime) / 1000;
        return elapsedTime < 5; // Remove cannonballs after 5 seconds
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleFireCannon = async () => {
    if (isFiring || !isShipRegistered) return;
    
    setIsFiring(true);
    setContractLoading(true);
    
    try {
      // Calculate trajectory off-chain for visualization
      const trajectory = BallisticsCalculator.calculateTrajectory({
        initialPosition: playerShipPosition,
        velocity: cannonVelocity[0],
        azimuthDeg: azimuthalAngle[0],
        elevationDeg: verticalAngle[0],
        gravity: 9.81
      });
      
      // Calculate initial velocity based on angles and speed for Three.js visualization
      const azimuthRad = (azimuthalAngle[0] * Math.PI) / 180;
      const verticalRad = (verticalAngle[0] * Math.PI) / 180;
      const speed = cannonVelocity[0] / 10; // Scale down for better visualization
      
      const velocity = new THREE.Vector3(
        speed * Math.cos(verticalRad) * Math.cos(azimuthRad),
        speed * Math.sin(verticalRad),
        speed * Math.cos(verticalRad) * Math.sin(azimuthRad)
      );
      
      // Fire cannonball through contract with trajectory calculation
      const contractResult = await contractService.fireCannonball({
        target: enemyAddress,
        velocity: cannonVelocity[0],
        azimuthDeg: azimuthalAngle[0],
        verticalDeg: verticalAngle[0],
        shooterPosition: playerShipPosition,
        targetPosition: enemyShipPosition,
        targetRadius: shipRadius
      });
      
      const newCannonball = {
        id: nextCannonballId,
        position: new THREE.Vector3(...playerShipPosition),
        velocity: velocity,
        startTime: Date.now(),
        contractResult: contractResult,
        trajectory: trajectory.points,
        flightTime: trajectory.flightTime
      };
      
      setCannonballs(prev => [...prev, newCannonball]);
      setNextCannonballId(prev => prev + 1);
      
      // Wait for cannonball animation to complete before showing result
      const animationTime = contractResult.flightTime ? Math.min(contractResult.flightTime * 1000, 4000) : 2500;
      
      setTimeout(() => {
        const damage = contractResult.hit ? Math.floor(Math.random() * 30) + 10 : 0;
        
        if (contractResult.hit) {
          setEnemyShipHealth(prev => Math.max(0, prev - damage));
          console.log('⛓️ ON-CHAIN EVENT: Direct hit confirmed by smart contract!');
        } else {
          console.log('⛓️ ON-CHAIN EVENT: Miss confirmed by smart contract - cannonball impact recorded');
        }
        
        setAttackResult({ 
          hit: contractResult.hit, 
          damage, 
          distance: contractResult.distanceFromTarget 
        });
        setShowAttackResult(true);
        setIsFiring(false);
        
        // Check for victory
        if (contractResult.hit && enemyShipHealth - damage <= 0) {
          setTimeout(() => onVictory(), 2000);
        }
      }, animationTime);
      
    } catch (error) {
      console.error('Error firing cannonball:', error);
      setIsFiring(false);
    } finally {
      setContractLoading(false);
    }
  };

  const handleCannonballHit = () => {
    console.log("[v0] Cannonball hit target!")
    setIsFiring(false)
    setShowAttackResult(true)
    setEnemyShipHealth(enemyShipHealth - 20)

    setTimeout(() => {
      setShowAttackResult(false)
      if (enemyShipHealth <= 0) {
        onVictory()
      }
    }, 2000)
  }

  const handleBackToMenu = () => {
    onVictory()
  }

  if (showAttackResult && attackResult) {
    return (
      <div className={`fixed inset-0 w-full h-full flex items-center justify-center ${
        attackResult.hit 
          ? 'bg-gradient-to-b from-green-400 via-green-500 to-green-600' 
          : 'bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600'
      }`}>
        <div className="text-center space-y-8 animate-pulse">
          <h1 className="text-8xl font-bold text-white drop-shadow-2xl animate-bounce">
            {attackResult.hit ? '🎯 DIRECT HIT! 🎯' : '💦 MISSED! 💦'}
          </h1>
          <p className="text-3xl text-white font-semibold drop-shadow-lg">
            {attackResult.hit 
              ? `You hit the enemy ship! Damage: ${attackResult.damage}` 
              : 'Your cannonball splashed into the ocean!'}
          </p>
          <div className="space-y-4">
            <p className="text-xl text-white/90">
              Distance from target: {attackResult.distance.toFixed(2)}m
            </p>
            <p className="text-lg text-white/80">
              Final Shot: {azimuthalAngle[0]}° azimuth, {verticalAngle[0]}° elevation
            </p>
            <Button
              onClick={handleBackToMenu}
              size="lg"
              className="px-12 py-6 text-2xl font-bold bg-white text-gray-800 hover:bg-gray-100 shadow-2xl"
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

        <Ship position={playerShipPosition} color="#3B82F6" isPlayer={true} />
        <Ship position={enemyShipPosition} color="#EF4444" isHit={enemyShipHealth <= 0} />

        {cannonballs.map(ball => {
          const currentTime = Date.now();
          const elapsedTime = (currentTime - ball.startTime) / 1000;
          const isActive = elapsedTime < 5; // Keep active for 5 seconds max
          
          return (
            <Cannonball
              key={ball.id}
              ballId={ball.id}
              startPosition={playerShipPosition}
              targetPosition={enemyShipPosition}
              onHit={(ballId) => {
                // Remove the cannonball when it hits
                setCannonballs(prev => prev.filter(b => b.id !== ballId));
              }}
              isActive={isActive}
              trajectory={ball.trajectory}
              flightTime={ball.flightTime}
            />
          );
        })}

        <Explosion position={[8, 2, 0]} isActive={showAttackResult} />

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
                min={10}
                step={5}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleFireCannon}
              disabled={isFiring || !isShipRegistered || contractLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Zap className="w-5 h-5 mr-2" />
              {contractLoading ? 'Processing...' : isFiring ? 'Firing...' : !isShipRegistered ? 'Registering Ship...' : 'Fire Cannon!'}
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-black/70 backdrop-blur-sm border-white/20">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Your Ship</div>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{playerShipHealth}%</div>
              <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                {isShipRegistered ? '✓ Registered' : 'Registering...'}
              </div>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
              <div className="text-sm text-red-600 dark:text-red-400 font-medium">Enemy Ship</div>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">{enemyShipHealth}%</div>
              <div className="text-xs text-red-500 dark:text-red-300 mt-1">
                Contract Target
              </div>
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

      <AttackResultModal
        isOpen={showAttackResult}
        onClose={() => setShowAttackResult(false)}
        result={attackResult}
      />
    </div>
  )
}

export default PVPBattleScreen;
