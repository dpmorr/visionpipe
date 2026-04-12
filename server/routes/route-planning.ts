import { Router } from 'express';
import { db } from '@db';
import { collectionRoutes, wastePoints } from '@db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { computeRoute, optimizeRoute, computeDirections } from '../services/google-routes';

const router = Router();

// Get all collection routes for the user's organization
router.get('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'No organization associated with user' });
    }

    const routes = await db.query.collectionRoutes.findMany({
      where: eq(collectionRoutes.organizationId, organizationId),
    });

    // Enrich with waste point data for stop counts
    const enriched = await Promise.all(routes.map(async (route) => {
      const points = route.wastePointIds?.length
        ? await db.query.wastePoints.findMany({
            where: inArray(wastePoints.id, route.wastePointIds),
          })
        : [];

      return {
        ...route,
        stops: points.length,
        customers: new Set(points.map(p => p.vendor)).size,
        estimatedTime: route.totalDurationSeconds
          ? `${Math.round(route.totalDurationSeconds / 60)} min`
          : 'Not calculated',
        date: route.scheduledDate || route.createdAt,
        wastePointDetails: points,
      };
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching collection routes:', error);
    res.status(500).json({ message: 'Failed to fetch routes' });
  }
});

// Get a single route by ID
router.get('/:id', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'No organization associated with user' });
    }

    const route = await db.query.collectionRoutes.findFirst({
      where: and(
        eq(collectionRoutes.id, parseInt(req.params.id)),
        eq(collectionRoutes.organizationId, organizationId)
      ),
    });

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Get waste point details
    const points = route.wastePointIds?.length
      ? await db.query.wastePoints.findMany({
          where: inArray(wastePoints.id, route.wastePointIds),
        })
      : [];

    res.json({ ...route, wastePointDetails: points });
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ message: 'Failed to fetch route' });
  }
});

// Create a new collection route
router.post('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'No organization associated with user' });
    }

    const { name, wastePointIds, depotLocation, scheduledDate } = req.body;

    if (!name || !wastePointIds?.length) {
      return res.status(400).json({ message: 'Name and at least one waste point are required' });
    }

    const [newRoute] = await db.insert(collectionRoutes).values({
      name,
      wastePointIds,
      depotLocation: depotLocation || null,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      organizationId,
      status: 'scheduled',
    }).returning();

    res.status(201).json(newRoute);
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ message: 'Failed to create route' });
  }
});

// Update a route
router.patch('/:id', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'No organization associated with user' });
    }

    const { name, status, wastePointIds, depotLocation, scheduledDate } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (wastePointIds !== undefined) updateData.wastePointIds = wastePointIds;
    if (depotLocation !== undefined) updateData.depotLocation = depotLocation;
    if (scheduledDate !== undefined) updateData.scheduledDate = new Date(scheduledDate);

    const [updated] = await db.update(collectionRoutes)
      .set(updateData)
      .where(and(
        eq(collectionRoutes.id, parseInt(req.params.id)),
        eq(collectionRoutes.organizationId, organizationId)
      ))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ message: 'Failed to update route' });
  }
});

// Delete a route
router.delete('/:id', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'No organization associated with user' });
    }

    const [deleted] = await db.delete(collectionRoutes)
      .where(and(
        eq(collectionRoutes.id, parseInt(req.params.id)),
        eq(collectionRoutes.organizationId, organizationId)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json({ message: 'Route deleted' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ message: 'Failed to delete route' });
  }
});

// Optimize a specific route
router.post('/:id/optimize', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'No organization associated with user' });
    }

    const route = await db.query.collectionRoutes.findFirst({
      where: and(
        eq(collectionRoutes.id, parseInt(req.params.id)),
        eq(collectionRoutes.organizationId, organizationId)
      ),
    });

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Get waste points with location data
    const points = await db.query.wastePoints.findMany({
      where: inArray(wastePoints.id, route.wastePointIds),
    });

    const stopsWithLocation = points
      .filter(p => p.locationData?.lat && p.locationData?.lng)
      .map(p => ({
        id: p.id,
        location: { lat: p.locationData!.lat, lng: p.locationData!.lng },
      }));

    if (stopsWithLocation.length < 2) {
      return res.status(400).json({
        message: 'At least 2 waste points with location data are required for optimization',
      });
    }

    // Use depot from route or first stop as depot
    const depot = route.depotLocation || stopsWithLocation[0].location;

    const result = await optimizeRoute(depot, stopsWithLocation);

    // Save optimization results
    const [updated] = await db.update(collectionRoutes)
      .set({
        optimizedOrder: result.optimizedOrder,
        routePolyline: result.polyline,
        totalDistanceMeters: result.totalDistanceMeters,
        totalDurationSeconds: result.totalDurationSeconds,
        optimizedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(collectionRoutes.id, route.id))
      .returning();

    res.json({
      ...updated,
      wastePointDetails: points,
      optimization: {
        distanceMiles: Math.round(result.totalDistanceMeters * 0.000621371 * 10) / 10,
        durationMinutes: Math.round(result.totalDurationSeconds / 60),
        stopsOptimized: result.optimizedOrder.length,
      },
    });
  } catch (error: any) {
    console.error('Error optimizing route:', error?.response?.data || error);
    res.status(500).json({
      message: 'Failed to optimize route',
      detail: error?.response?.data?.error?.message || error.message,
    });
  }
});

// Ad-hoc: compute directions between ordered locations (no persistence)
router.post('/compute-directions', async (req, res) => {
  try {
    const { locations } = req.body;

    if (!locations || locations.length < 2) {
      return res.status(400).json({ message: 'At least 2 locations are required' });
    }

    const result = await computeDirections(locations);

    res.json({
      polyline: result.polyline,
      distanceMeters: result.distanceMeters,
      distanceMiles: Math.round(result.distanceMeters * 0.000621371 * 10) / 10,
      durationSeconds: result.durationSeconds,
      durationMinutes: Math.round(result.durationSeconds / 60),
      legs: result.legs,
    });
  } catch (error: any) {
    console.error('Error computing directions:', error?.response?.data || error);
    res.status(500).json({
      message: 'Failed to compute directions',
      detail: error?.response?.data?.error?.message || error.message,
    });
  }
});

// Ad-hoc: optimize a set of stops without persisting
router.post('/optimize-stops', async (req, res) => {
  try {
    const { depot, wastePointIds } = req.body;

    if (!wastePointIds?.length || wastePointIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 waste point IDs are required' });
    }

    // Fetch waste points
    const points = await db.query.wastePoints.findMany({
      where: inArray(wastePoints.id, wastePointIds),
    });

    const stopsWithLocation = points
      .filter(p => p.locationData?.lat && p.locationData?.lng)
      .map(p => ({
        id: p.id,
        location: { lat: p.locationData!.lat, lng: p.locationData!.lng },
      }));

    if (stopsWithLocation.length < 2) {
      return res.status(400).json({
        message: 'At least 2 waste points with location data are required',
      });
    }

    const depotLocation = depot || stopsWithLocation[0].location;
    const result = await optimizeRoute(depotLocation, stopsWithLocation);

    // Map optimized order back to waste point details
    const orderedPoints = result.optimizedOrder.map((id: number) =>
      points.find(p => p.id === id)
    ).filter(Boolean);

    res.json({
      optimizedOrder: result.optimizedOrder,
      orderedPoints,
      polyline: result.polyline,
      totalDistanceMeters: result.totalDistanceMeters,
      distanceMiles: Math.round(result.totalDistanceMeters * 0.000621371 * 10) / 10,
      totalDurationSeconds: result.totalDurationSeconds,
      durationMinutes: Math.round(result.totalDurationSeconds / 60),
    });
  } catch (error: any) {
    console.error('Error optimizing stops:', error?.response?.data || error);
    res.status(500).json({
      message: 'Failed to optimize stops',
      detail: error?.response?.data?.error?.message || error.message,
    });
  }
});

export default router;
