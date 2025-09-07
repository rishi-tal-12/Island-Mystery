// Physics calculations for cannonball trajectory
export interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
  time: number;
}

export interface BallisticParams {
  initialPosition: [number, number, number];
  velocity: number;
  azimuthDeg: number;
  elevationDeg: number;
  gravity: number;
}

export interface TrajectoryResult {
  points: TrajectoryPoint[];
  impactPoint: [number, number, number];
  flightTime: number;
  maxHeight: number;
}

export class BallisticsCalculator {
  private static readonly GRAVITY = 9.81; // m/s²
  private static readonly TIME_STEP = 0.1; // seconds
  private static readonly MAX_FLIGHT_TIME = 10; // seconds

  /**
   * Calculate complete trajectory for a projectile
   */
  static calculateTrajectory(params: BallisticParams): TrajectoryResult {
    const {
      initialPosition: [x0, y0, z0],
      velocity,
      azimuthDeg,
      elevationDeg,
      gravity = this.GRAVITY
    } = params;

    // Convert angles to radians
    const azimuthRad = (azimuthDeg * Math.PI) / 180;
    const elevationRad = (elevationDeg * Math.PI) / 180;

    // Calculate initial velocity components
    const vx = velocity * Math.cos(elevationRad) * Math.cos(azimuthRad);
    const vy = velocity * Math.sin(elevationRad);
    const vz = velocity * Math.cos(elevationRad) * Math.sin(azimuthRad);

    const points: TrajectoryPoint[] = [];
    let maxHeight = y0;
    let t = 0;

    // Calculate trajectory points
    while (t <= this.MAX_FLIGHT_TIME) {
      const x = x0 + vx * t;
      const y = y0 + vy * t - 0.5 * gravity * t * t;
      const z = z0 + vz * t;

      points.push({ x, y, z, time: t });

      if (y > maxHeight) {
        maxHeight = y;
      }

      // Stop if projectile hits ground (y <= 0)
      if (y <= 0 && t > 0) {
        break;
      }

      t += this.TIME_STEP;
    }

    // Calculate exact impact point using quadratic formula
    const impactTime = this.calculateImpactTime(y0, vy, gravity);
    const impactPoint: [number, number, number] = [
      x0 + vx * impactTime,
      0, // Ground level
      z0 + vz * impactTime
    ];

    return {
      points,
      impactPoint,
      flightTime: impactTime,
      maxHeight
    };
  }

  /**
   * Calculate time when projectile hits ground (y = 0)
   */
  private static calculateImpactTime(y0: number, vy: number, gravity: number): number {
    // Using quadratic formula: y = y0 + vy*t - 0.5*g*t²
    // When y = 0: 0.5*g*t² - vy*t - y0 = 0
    const a = 0.5 * gravity;
    const b = -vy;
    const c = -y0;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return 0;

    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

    // Return the positive time that's not zero
    return Math.max(t1, t2);
  }

  /**
   * Calculate distance between two 3D points
   */
  static calculateDistance(point1: [number, number, number], point2: [number, number, number]): number {
    const [x1, y1, z1] = point1;
    const [x2, y2, z2] = point2;
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
  }

  /**
   * Check if impact point is within target radius
   */
  static checkHit(impactPoint: [number, number, number], targetPosition: [number, number, number], targetRadius: number): boolean {
    // Only check X and Z coordinates for 2D collision (ignore Y since it's ground level)
    const distance2D = Math.sqrt(
      (impactPoint[0] - targetPosition[0]) ** 2 + 
      (impactPoint[2] - targetPosition[2]) ** 2
    );
    return distance2D <= targetRadius;
  }

  /**
   * Convert world coordinates to contract scale (multiply by 100)
   */
  static worldToContract(worldCoords: [number, number, number]): [number, number, number] {
    return [
      Math.floor(worldCoords[0] * 100),
      Math.floor(worldCoords[1] * 100),
      Math.floor(worldCoords[2] * 100)
    ];
  }

  /**
   * Convert contract coordinates to world scale (divide by 100)
   */
  static contractToWorld(contractCoords: [number, number, number]): [number, number, number] {
    return [
      contractCoords[0] / 100,
      contractCoords[1] / 100,
      contractCoords[2] / 100
    ];
  }
}
