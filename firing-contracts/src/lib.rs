//!
//! Stylus Ship Firing Contract
//!
//! This contract implements a physics-based cannonball firing system for PvP ship battles.
//! It calculates projectile trajectories and determines hits based on ship positions.
//!
//! Note: this code is a template-only and has not been audited.
//!
// Allow `cargo stylus export-abi` to generate a main function.
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::vec::Vec;

/// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::{alloy_primitives::{U256, I256, Address}, prelude::*};

/// Gravity constant (fixed-point scaled by 1000)
const GRAVITY: i64 = 10_000;

/// Cannonball parameters
#[derive(Clone)]
pub struct Cannonball {
    pub velocity: u64,      // Velocity in units/second
    pub azimuth_deg: i64,   // 0-359 degrees horizontal angle
    pub vertical_deg: i64,  // 0-90 degrees vertical angle
}

sol_storage! {
    /// Ship position and size
    pub struct Ship {
        int256 x;           // X coordinate
        int256 z;           // Z coordinate  
        uint256 radius;     // Hit radius
    }
}

sol_storage! {
    /// Battle result
    pub struct BattleResult {
        bool hit;
        int256 impact_x;
        int256 impact_z;
        uint256 distance_from_target;
    }
}

// Define persistent storage using the Solidity ABI.
sol_storage! {
    #[entrypoint]
    pub struct ShipFiring {
        /// Mapping from player address to their ship position
        mapping(address => Ship) ships;
        /// Battle history counter
        uint256 battle_count;
        /// Mapping from battle ID to battle result
        mapping(uint256 => BattleResult) battle_results;
    }
}

/// Declare that `ShipFiring` is a contract with the following external methods.
#[public]
impl ShipFiring {
    /// Register a ship at a specific position
    pub fn register_ship(&mut self, x: I256, z: I256, radius: U256) {
        let caller = self.vm().msg_sender();
        let mut ship = self.ships.setter(caller);
        ship.x.set(x);
        ship.z.set(z);
        ship.radius.set(radius);
    }

    /// Fire a cannonball at a target ship
    pub fn fire_cannonball(
        &mut self,
        target: Address,
        velocity: U256,
        azimuth_deg: I256,
        vertical_deg: I256,
    ) -> (bool, I256, I256, U256) {
        // Get target ship
        let target_ship = self.ships.getter(target);
        let ship_x = target_ship.x.get();
        let ship_z = target_ship.z.get();
        let ship_radius = target_ship.radius.get();
        
        // Create cannonball
        let cannonball = Cannonball {
            velocity: u256_to_u64(velocity),
            azimuth_deg: i256_to_i64(azimuth_deg),
            vertical_deg: i256_to_i64(vertical_deg),
        };

        // Compute impact position
        let (impact_x, impact_z) = compute_impact_position(&cannonball);
        
        // Check if hit
        let hit = check_hit_i256(I256::try_from(impact_x).unwrap_or(I256::ZERO), 
                                 I256::try_from(impact_z).unwrap_or(I256::ZERO), 
                                 ship_x, ship_z, ship_radius);
        
        // Calculate distance from target
        let dx = impact_x - i256_to_i64(ship_x);
        let dz = impact_z - i256_to_i64(ship_z);
        let distance = U256::from(int_sqrt((dx * dx + dz * dz) as u64));

        // Store battle result
        let battle_id = self.battle_count.get();
        let mut result = self.battle_results.setter(battle_id);
        result.hit.set(hit);
        result.impact_x.set(I256::try_from(impact_x).unwrap_or(I256::ZERO));
        result.impact_z.set(I256::try_from(impact_z).unwrap_or(I256::ZERO));
        result.distance_from_target.set(distance);
        
        self.battle_count.set(battle_id + U256::from(1));

        (hit, I256::try_from(impact_x).unwrap_or(I256::ZERO), 
         I256::try_from(impact_z).unwrap_or(I256::ZERO), distance)
    }

    /// Get ship position for a player
    pub fn get_ship(&self, player: Address) -> (I256, I256, U256) {
        let ship = self.ships.getter(player);
        (ship.x.get(), ship.z.get(), ship.radius.get())
    }

    /// Get battle result by ID
    pub fn get_battle_result(&self, battle_id: U256) -> (bool, I256, I256, U256) {
        let result = self.battle_results.getter(battle_id);
        (result.hit.get(), result.impact_x.get(), result.impact_z.get(), result.distance_from_target.get())
    }

    /// Get total number of battles
    pub fn get_battle_count(&self) -> U256 {
        self.battle_count.get()
    }
}

/// Helper functions for physics calculations
/// Approximate degrees to radians conversion (fixed-point: 1000 units = 1 radian)
pub fn deg_to_rad(deg: i64) -> i64 {
    // π ≈ 3.14159 → multiplied by 1000 for fixed-point
    (deg * 3141) / 180
}

/// Cos approximation using lookup table for common angles
pub fn approximate_cos(deg: i64) -> i64 {
    // Normalize angle to 0-360 range
    let normalized_deg = ((deg % 360) + 360) % 360;
    
    match normalized_deg {
        0 => 1000,      // cos(0°) = 1
        30 => 866,      // cos(30°) ≈ 0.866
        45 => 707,      // cos(45°) ≈ 0.707
        60 => 500,      // cos(60°) = 0.5
        90 => 0,        // cos(90°) = 0
        120 => -500,    // cos(120°) = -0.5
        135 => -707,    // cos(135°) ≈ -0.707
        150 => -866,    // cos(150°) ≈ -0.866
        180 => -1000,   // cos(180°) = -1
        210 => -866,    // cos(210°) ≈ -0.866
        225 => -707,    // cos(225°) ≈ -0.707
        240 => -500,    // cos(240°) = -0.5
        270 => 0,       // cos(270°) = 0
        300 => 500,     // cos(300°) = 0.5
        315 => 707,     // cos(315°) ≈ 0.707
        330 => 866,     // cos(330°) ≈ 0.866
        _ => {
            // Linear interpolation for other angles
            if normalized_deg < 90 {
                1000 - (normalized_deg * 1000) / 90
            } else if normalized_deg < 180 {
                -(normalized_deg - 90) * 1000 / 90
            } else if normalized_deg < 270 {
                -1000 + (normalized_deg - 180) * 1000 / 90
            } else {
                (normalized_deg - 270) * 1000 / 90
            }
        }
    }
}

/// Sin approximation using lookup table for common angles
pub fn approximate_sin(deg: i64) -> i64 {
    // Normalize angle to 0-360 range
    let normalized_deg = ((deg % 360) + 360) % 360;
    
    match normalized_deg {
        0 => 0,         // sin(0°) = 0
        30 => 500,      // sin(30°) = 0.5
        45 => 707,      // sin(45°) ≈ 0.707
        60 => 866,      // sin(60°) ≈ 0.866
        90 => 1000,     // sin(90°) = 1
        120 => 866,     // sin(120°) ≈ 0.866
        135 => 707,     // sin(135°) ≈ 0.707
        150 => 500,     // sin(150°) = 0.5
        180 => 0,       // sin(180°) = 0
        210 => -500,    // sin(210°) = -0.5
        225 => -707,    // sin(225°) ≈ -0.707
        240 => -866,    // sin(240°) ≈ -0.866
        270 => -1000,   // sin(270°) = -1
        300 => -866,    // sin(300°) ≈ -0.866
        315 => -707,    // sin(315°) ≈ -0.707
        330 => -500,    // sin(330°) = -0.5
        _ => {
            // Linear interpolation for other angles
            if normalized_deg < 90 {
                normalized_deg * 1000 / 90
            } else if normalized_deg < 180 {
                1000 - (normalized_deg - 90) * 1000 / 90
            } else if normalized_deg < 270 {
                -(normalized_deg - 180) * 1000 / 90
            } else {
                -1000 + (normalized_deg - 270) * 1000 / 90
            }
        }
    }
}

/// Compute impact position where y = 0 (sea level)
pub fn compute_impact_position(cannonball: &Cannonball) -> (i64, i64) {
    let azimuth_cos = approximate_cos(cannonball.azimuth_deg);
    let azimuth_sin = approximate_sin(cannonball.azimuth_deg);

    let vertical_cos = approximate_cos(cannonball.vertical_deg);
    let vertical_sin = approximate_sin(cannonball.vertical_deg);

    // Calculate velocity components (scaled by 1000)
    let v_vertical = (cannonball.velocity as i64 * vertical_sin) / 1000;
    let v_horizontal = (cannonball.velocity as i64 * vertical_cos) / 1000;

    // Time of flight calculation: t = 2 * v_vertical / gravity
    // Avoid division by zero
    if v_vertical <= 0 {
        return (0, 0);
    }
    
    let t_impact = (2 * v_vertical * 1000) / GRAVITY; // Scale up to maintain precision

    // Calculate impact positions
    // For azimuth = 0°: cos(0°) = 1000, sin(0°) = 0
    // So impact_x should be the main forward distance, impact_z should be lateral
    let range = (v_horizontal * t_impact) / 1000; // Total range
    
    let impact_x = (range * azimuth_cos) / 1000;  // Forward component
    let impact_z = (range * azimuth_sin) / 1000;  // Lateral component

    (impact_x, impact_z)
}

/// Check if cannonball hits the ship (I256 version for storage types)
pub fn check_hit_i256(impact_x: I256, impact_z: I256, ship_x: I256, ship_z: I256, ship_radius: U256) -> bool {
    let dx_i256 = impact_x - ship_x;
    let dz_i256 = impact_z - ship_z;
    
    // Convert to i64 for calculations
    let dx = i256_to_i64(dx_i256);
    let dz = i256_to_i64(dz_i256);
    let radius = u256_to_u64(ship_radius) as i64;
    
    let distance_sq = dx * dx + dz * dz;
    let radius_sq = radius * radius;

    distance_sq <= radius_sq
}

/// Integer square root approximation
pub fn int_sqrt(n: u64) -> u64 {
    if n == 0 {
        return 0;
    }
    
    let mut x = n;
    let mut y = x.div_ceil(2);
    
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    
    x
}

/// Convert U256 to u64 (with overflow protection)
pub fn u256_to_u64(value: U256) -> u64 {
    if value > U256::from(u64::MAX) {
        u64::MAX
    } else {
        value.to::<u64>()
    }
}

/// Convert I256 to i64 (with overflow protection)
pub fn i256_to_i64(value: I256) -> i64 {
    let max_i64 = I256::try_from(i64::MAX).unwrap_or(I256::ZERO);
    let min_i64 = I256::try_from(i64::MIN).unwrap_or(I256::ZERO);
    
    if value > max_i64 {
        i64::MAX
    } else if value < min_i64 {
        i64::MIN
    } else {
        // Use as_limbs() to extract the value safely
        let limbs = value.as_limbs();
        if !limbs.is_empty() {
            limbs[0] as i64
        } else {
            0
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_physics_calculations() {
        let cannonball = Cannonball {
            velocity: 1000,
            azimuth_deg: 0,
            vertical_deg: 45,
        };

        let (impact_x, impact_z) = compute_impact_position(&cannonball);
        
        // Basic sanity check - impact should be positive for 45 degree angle
        assert!(impact_x >= 0);
        assert!(impact_z >= 0);
    }

    #[test]
    fn test_hit_detection() {
        // Test hit detection with I256 values
        let impact_x = I256::try_from(100).unwrap();
        let impact_z = I256::try_from(100).unwrap();
        let ship_x = I256::try_from(100).unwrap();
        let ship_z = I256::try_from(100).unwrap();
        let ship_radius = U256::from(50);

        // Test direct hit
        assert!(check_hit_i256(impact_x, impact_z, ship_x, ship_z, ship_radius));
        
        // Test near miss within radius
        let impact_x2 = I256::try_from(120).unwrap();
        let impact_z2 = I256::try_from(120).unwrap();
        assert!(check_hit_i256(impact_x2, impact_z2, ship_x, ship_z, ship_radius));
        
        // Test clear miss
        let impact_x3 = I256::try_from(200).unwrap();
        let impact_z3 = I256::try_from(200).unwrap();
        assert!(!check_hit_i256(impact_x3, impact_z3, ship_x, ship_z, ship_radius));
    }
}
