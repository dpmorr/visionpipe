import type { SensorData } from "../types";
import { db } from "../../db";
import { sensors } from "../../db/schema";
import { eq } from "drizzle-orm";

/**
 * IoT Service for managing sensor connections
 * 
 * This service has been updated to use an access code system instead of AWS IoT Core.
 * It provides similar functionality but with a simplified authentication mechanism
 * that correlates with IoT devices that have been set up.
 */
export class IoTService {
  constructor() {
    console.log('Initializing IoT service with access code authentication');
  }

  /**
   * Register a new sensor with the IoT service
   * @param sensorId Sensor ID in the database
   * @param sensorName Human-readable name for the sensor
   * @param accessCode Optional access code to assign to the sensor
   */
  async registerSensor(sensorId: string, sensorName: string, accessCode?: string) {
    try {
      console.log(`Registering sensor with ID ${sensorId}`);
      
      // Generate access code if not provided
      const generatedAccessCode = accessCode || `SENSOR${sensorId}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Update the sensor in the database with the access code
      await db.update(sensors)
        .set({ 
          accessCode: generatedAccessCode,
          connectionStatus: 'disconnected'
        })
        .where(eq(sensors.id, parseInt(sensorId)));
      
      console.log(`Successfully registered sensor ${sensorId} with access code ${generatedAccessCode}`);
      return { success: true, accessCode: generatedAccessCode };
    } catch (error) {
      console.error(`Error registering sensor ${sensorId}:`, error);
      throw error;
    }
  }

  /**
   * Update sensor data
   * @param sensorId Sensor ID in the database
   * @param data Sensor readings and data
   */
  async updateSensorData(sensorId: string, data: SensorData) {
    try {
      console.log(`Updating data for sensor ${sensorId}:`, data);
      
      // Update sensor data in the database
      await db.update(sensors)
        .set({ 
          lastReading: data.reading ? parseFloat(data.reading.toString()) : null,
          lastReadingUnit: data.unit || null,
          lastUpdated: new Date(),
          status: 'active'
        })
        .where(eq(sensors.id, parseInt(sensorId)));
      
      console.log(`Successfully updated data for sensor ${sensorId}`);
      return { success: true };
    } catch (error) {
      console.error(`Error updating data for sensor ${sensorId}:`, error);
      throw error;
    }
  }

  /**
   * Get the connection status of a sensor
   * @param sensorId Sensor ID in the database
   * @returns Connection status (connected or disconnected)
   */
  async getSensorConnectionStatus(sensorId: string): Promise<'connected' | 'disconnected'> {
    try {
      console.log(`Checking connection status for sensor ${sensorId}`);
      
      // Get the sensor from the database
      const sensor = await db.query.sensors.findFirst({
        where: eq(sensors.id, parseInt(sensorId))
      });
      
      if (!sensor) {
        console.error(`Sensor ${sensorId} not found`);
        return 'disconnected';
      }
      
      return sensor.connectionStatus as 'connected' | 'disconnected' || 'disconnected';
    } catch (error) {
      console.error(`Error getting connection status for sensor ${sensorId}:`, error);
      return 'disconnected';
    }
  }

  /**
   * Authenticate a sensor using its access code
   * @param sensorId Sensor ID in the database
   * @param accessCode Access code for the sensor
   * @returns Whether authentication was successful
   */
  async authenticateSensor(sensorId: string, accessCode: string): Promise<boolean> {
    try {
      console.log(`Authenticating sensor ${sensorId}`);
      
      // Get the sensor from the database
      const sensor = await db.query.sensors.findFirst({
        where: eq(sensors.id, parseInt(sensorId))
      });
      
      if (!sensor) {
        console.error(`Sensor ${sensorId} not found`);
        return false;
      }
      
      // Check if the access code matches
      return sensor.accessCode === accessCode;
    } catch (error) {
      console.error(`Error authenticating sensor ${sensorId}:`, error);
      return false;
    }
  }
}

// Export a singleton instance
export const awsIoTService = new IoTService();