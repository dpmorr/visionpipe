import { Router } from 'express';
import { db } from '@db';
import { sql } from 'drizzle-orm';
import { sustainabilityMetrics, wastePoints } from '@db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

const router = Router();

/**
 * @openapi
 * /metrics/available:
 *   get:
 *     summary: Get available metrics
 *     tags:
 *       - Metrics
 *     responses:
 *       200:
 *         description: List of available metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/available', async (req, res) => {
  try {
    // List of all available metrics that can be used in charts
    const availableMetrics = [
      'waste_reduction',
      'recycling_rate', 
      'carbon_footprint',
      'cost_savings',
      'vendor_performance'
    ];
    res.json(availableMetrics);
  } catch (error) {
    console.error('Error fetching available metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch available metrics',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Chart data endpoint
router.get('/chart-data', async (req, res) => {
  try {
    const { metric, timeframe, aggregation } = req.query;
    const organizationId = req.user?.organizationId || 2;

    console.log('Fetching chart data:', { metric, timeframe, aggregation });
    console.log('Organization ID:', organizationId);

    if (!metric || !timeframe || !aggregation) {
      console.error('Missing required parameters:', { metric, timeframe, aggregation });
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: { metric, timeframe, aggregation }
      });
    }

    const { start_date, end_date } = getTimeframeQuery(timeframe as string);
    console.log('Date range:', { start_date, end_date });

    // Ensure sample data exists
    await ensureSampleData(organizationId);

    console.log('Querying metrics with params:', {
      organizationId,
      metricType: metric,
      start_date,
      end_date
    });

    const metrics = await db.query.sustainabilityMetrics.findMany({
      where: and(
        eq(sustainabilityMetrics.organizationId, organizationId),
        eq(sustainabilityMetrics.metricType, metric as string),
        gte(sustainabilityMetrics.timestamp, start_date),
        lte(sustainabilityMetrics.timestamp, end_date)
      ),
      orderBy: sustainabilityMetrics.timestamp
    });

    console.log(`Found ${metrics.length} data points for chart`);

    if (metrics.length === 0) {
      console.log('No data found for the given parameters');
      return res.json([]);
    }

    // Process and aggregate data based on aggregation type
    const processedData = metrics.map(m => ({
      timestamp: m.timestamp.toISOString(),
      value: parseFloat(m.value),
      category: m.metricType
    }));

    console.log('Returning processed chart data:', processedData);
    res.json(processedData);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : '');
    res.status(500).json({
      error: 'Failed to fetch chart data',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Function to insert sample data if none exists
async function ensureSampleData(organizationId: number) {
  try {
    console.log('Checking and generating sample data...');
    console.log('Organization ID:', organizationId);

    // Check if data exists
    const existingData = await db.query.sustainabilityMetrics.findFirst({
      where: eq(sustainabilityMetrics.organizationId, organizationId)
    });

    console.log('Existing data check result:', existingData);

    if (existingData) {
      console.log('Sample data already exists, skipping generation');
      return;
    }

    // Clear existing data for this organization
    await db.delete(sustainabilityMetrics)
      .where(eq(sustainabilityMetrics.organizationId, organizationId));

    const sampleData = [];
    const now = new Date();

    // Generate 3 entries per day for the last 365 days to support all timeframes
    for (let i = 0; i < 365; i++) {
      const baseDate = new Date(now);
      baseDate.setDate(baseDate.getDate() - i);

      // Generate 3 entries for this day (morning, afternoon, evening)
      for (let j = 0; j < 3; j++) {
        const date = new Date(baseDate);
        date.setHours(8 + (j * 6)); // 8am, 2pm, 8pm

        // Gradual improvement trend over time with daily variation
        const dayFactor = 0.8 + (i / 365) * 0.4;
        const timeOfDayFactor = 1 + Math.sin(j * Math.PI / 2) * 0.1;

        sampleData.push(...generateMetricsSet(organizationId, date, dayFactor * timeOfDayFactor));
      }
    }

    console.log(`Inserting ${sampleData.length} sample data points...`);
    await db.insert(sustainabilityMetrics).values(sampleData);
    console.log('Sample data inserted successfully');
  } catch (error) {
    console.error('Error in ensureSampleData:', error);
    throw error;
  }
}

function generateMetricsSet(organizationId: number, timestamp: Date, factor: number) {
  return [
    {
      organizationId,
      metricType: 'waste_reduction',
      value: String(50.5 * factor + Math.random() * 10 - 5),
      timestamp
    },
    {
      organizationId,
      metricType: 'recycling_rate',
      value: String(75.0 * factor + Math.random() * 5 - 2.5),
      timestamp
    },
    {
      organizationId,
      metricType: 'carbon_footprint',
      value: String(8.3 * factor + Math.random() * 2 - 1),
      timestamp
    },
    {
      organizationId,
      metricType: 'cost_savings',
      value: String(450.0 * factor + Math.random() * 50 - 25),
      timestamp
    },
    {
      organizationId,
      metricType: 'vendor_performance',
      value: String(85.0 * factor + Math.random() * 5 - 2.5),
      timestamp
    }
  ];
}

function getTimeframeQuery(timeframe: string) {
  const end_date = new Date();
  let start_date = new Date();

  switch (timeframe) {
    case '1m':
      start_date.setMonth(start_date.getMonth() - 1);
      break;
    case '3m':
      start_date.setMonth(start_date.getMonth() - 3);
      break;
    case '6m':
      start_date.setMonth(start_date.getMonth() - 6);
      break;
    case '1y':
      start_date.setFullYear(start_date.getFullYear() - 1);
      break;
    default:
      start_date.setMonth(start_date.getMonth() - 1); // Default to 1 month
  }

  return { start_date, end_date };
}

/**
 * @openapi
 * /metrics/sustainability/{timeframe}:
 *   get:
 *     summary: Get sustainability metrics
 *     tags:
 *       - Metrics
 *     parameters:
 *       - in: path
 *         name: timeframe
 *         required: false
 *         schema:
 *           type: string
 *           default: 1m
 *         description: Timeframe (e.g. 1m, 3m, 1y)
 *     responses:
 *       200:
 *         description: Sustainability metrics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// Enhanced sustainability metrics endpoint
router.get('/sustainability/:timeframe?', async (req, res) => {
  try {
    console.log('Received request for sustainability metrics');
    console.log('Request params:', req.params);
    console.log('Request query:', req.query);
    console.log('Request user:', req.user);

    const timeframe = req.params.timeframe || '1m';
    const { start_date, end_date } = getTimeframeQuery(timeframe);
    const organizationId = req.user?.organizationId || 2;

    console.log('Fetching metrics for timeframe:', timeframe);
    console.log('Organization ID:', organizationId);
    console.log('Date range:', { start_date, end_date });

    // Ensure we have sample data
    await ensureSampleData(organizationId);

    // Get metrics data for the specified timeframe
    console.log('Fetching metrics data...');
    const metrics = await db.query.sustainabilityMetrics.findMany({
      where: and(
        eq(sustainabilityMetrics.organizationId, organizationId),
        gte(sustainabilityMetrics.timestamp, start_date),
        lte(sustainabilityMetrics.timestamp, end_date)
      ),
      orderBy: sustainabilityMetrics.timestamp
    });
    console.log(`Found ${metrics.length} metrics records`);

    // Get waste points data
    console.log('Fetching waste points data...');
    const wastePointsData = await db.query.wastePoints.findMany({
      where: eq(wastePoints.organizationId, organizationId)
    });
    console.log(`Found ${wastePointsData.length} waste points`);

    // Group metrics by waste point and type
    const wastePointMetrics: Record<string, any> = {};
    wastePointsData.forEach(wp => {
      wastePointMetrics[wp.id] = {
        id: wp.id,
        processStep: wp.processStep,
        wasteType: wp.wasteType,
        estimatedVolume: wp.estimatedVolume,
        unit: wp.unit,
        vendor: wp.vendor,
        metrics: {
          waste_reduction: [],
          recycling_rate: [],
          carbon_footprint: [],
          cost_savings: [],
          vendor_performance: []
        }
      };
    });

    // Group historical data by metric type and timestamp
    console.log('Processing metrics data...');
    const historicalData: Record<string, { timestamp: string; value: number }[]> = {};
    let totalWasteReduction = 0;
    let totalCarbonFootprint = 0;
    let totalCostSavings = 0;
    let recyclingRateSum = 0;
    let recyclingRateCount = 0;
    let vendorPerformanceSum = 0;
    let vendorPerformanceCount = 0;

    metrics.forEach(metric => {
      try {
        if (!historicalData[metric.metricType]) {
          historicalData[metric.metricType] = [];
        }

        const value = parseFloat(metric.value);
        historicalData[metric.metricType].push({
          timestamp: metric.timestamp.toISOString(),
          value
        });

        // Distribute metrics among waste points evenly for demo
        wastePointsData.forEach((wp, index) => {
          if (!wastePointMetrics[wp.id].metrics[metric.metricType]) {
            wastePointMetrics[wp.id].metrics[metric.metricType] = [];
          }

          // Add some variation based on waste point index
          const wpValue = value * (0.8 + (index * 0.1));
          wastePointMetrics[wp.id].metrics[metric.metricType].push({
            timestamp: metric.timestamp.toISOString(),
            value: wpValue
          });
        });

        // Accumulate totals or sums based on metric type
        switch (metric.metricType) {
          case 'waste_reduction':
            totalWasteReduction += value;
            break;
          case 'carbon_footprint':
            totalCarbonFootprint += value;
            break;
          case 'cost_savings':
            totalCostSavings += value;
            break;
          case 'recycling_rate':
            recyclingRateSum += value;
            recyclingRateCount++;
            break;
          case 'vendor_performance':
            vendorPerformanceSum += value;
            vendorPerformanceCount++;
            break;
        }
      } catch (error) {
        console.error('Error processing metric:', metric, error);
      }
    });

    console.log('Preparing response data...');
    // Transform data for frontend
    const transformedData = {
      wasteReduction: totalWasteReduction,
      recyclingRate: recyclingRateCount > 0 ? recyclingRateSum / recyclingRateCount : 0,
      carbonFootprint: totalCarbonFootprint,
      costSavings: totalCostSavings,
      vendorPerformance: vendorPerformanceCount > 0 ? vendorPerformanceSum / vendorPerformanceCount : 0,
      history: {
        wasteReduction: historicalData['waste_reduction'] || [],
        recyclingRate: historicalData['recycling_rate'] || [],
        carbonFootprint: historicalData['carbon_footprint'] || [],
        costSavings: historicalData['cost_savings'] || [],
        vendorPerformance: historicalData['vendor_performance'] || []
      },
      wastePoints: Object.values(wastePointMetrics)
    };

    console.log('Sending response...');
    res.json(transformedData);
  } catch (error) {
    console.error('Error in metrics endpoint:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : '');
    res.status(500).json({ 
      error: 'Failed to fetch metrics', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Add disposal trends endpoint
router.get('/disposal-trends/:timeframe?', async (req, res) => {
  try {
    const timeframe = req.params.timeframe || '1m';
    const { start_date, end_date } = getTimeframeQuery(timeframe);
    const organizationId = req.user?.organizationId || 2;

    console.log('Fetching disposal trends for timeframe:', timeframe);
    console.log('Date range:', { start_date, end_date });

    // Ensure sample data exists
    await ensureSampleData(organizationId);

    // Get metrics data for the specified timeframe
    const metrics = await db.query.sustainabilityMetrics.findMany({
      where: and(
        eq(sustainabilityMetrics.organizationId, organizationId),
        gte(sustainabilityMetrics.timestamp, start_date),
        lte(sustainabilityMetrics.timestamp, end_date)
      ),
      orderBy: sustainabilityMetrics.timestamp
    });

    // Get waste points data
    const wastePointsData = await db.query.wastePoints.findMany({
      where: eq(wastePoints.organizationId, organizationId)
    });

    // Group metrics by type and waste point
    const wasteData = metrics.filter(m => m.metricType === 'waste_reduction');
    const recyclingData = metrics.filter(m => m.metricType === 'recycling_rate');

    // Transform data for the chart, including waste point specific data
    const history = {
      wasteReduction: wasteData.map(w => ({
        timestamp: w.timestamp.toISOString(),
        value: parseFloat(w.value),
        wastePoint: wastePointsData[Math.floor(Math.random() * wastePointsData.length)]?.processStep || 'Unknown'
      })),
      recyclingRate: recyclingData.map(r => ({
        timestamp: r.timestamp.toISOString(),
        value: parseFloat(r.value),
        wastePoint: wastePointsData[Math.floor(Math.random() * wastePointsData.length)]?.processStep || 'Unknown'
      }))
    };

    res.json({ history, wastePoints: wastePointsData });
  } catch (error) {
    console.error('Error fetching disposal trends:', error);
    res.status(500).json({
      error: 'Failed to fetch disposal trends',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @openapi
 * /metrics/analyze:
 *   post:
 *     summary: Analyze metrics with AI
 *     tags:
 *       - Metrics
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *               timeframe:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI analysis result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// Add AI analysis endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { type, metrics, timeframe } = req.body;
    const organizationId = req.user?.organizationId || 2;

    if (!type || !metrics || !timeframe) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log('Analyzing metrics:', { type, metrics, timeframe });
    const { start_date, end_date } = getTimeframeQuery(timeframe);

    // Fetch metrics data for analysis
    const metricsData = await Promise.all(
      metrics.map(async (metric: string) => {
        const data = await db.query.sustainabilityMetrics.findMany({
          where: and(
            eq(sustainabilityMetrics.organizationId, organizationId),
            eq(sustainabilityMetrics.metricType, metric),
            gte(sustainabilityMetrics.timestamp, start_date),
            lte(sustainabilityMetrics.timestamp, end_date)
          ),
          orderBy: sustainabilityMetrics.timestamp
        });
        return {
          metric,
          values: data.map(m => ({
            timestamp: m.timestamp,
            value: Number(m.value)
          }))
        };
      })
    );

    console.log('Fetched metrics data:', metricsData);

    let analysis = '';
    let recommendations: string[] = [];
    let visualData = null;

    switch (type) {
      case 'trend':
        const trends = metricsData.map(metricData => {
          const values = metricData.values;
          if (values.length < 2) return null;

          const firstValue = values[0].value;
          const lastValue = values[values.length - 1].value;
          const change = ((lastValue - firstValue) / firstValue) * 100;

          return {
            metric: metricData.metric,
            change: change.toFixed(2),
            direction: change >= 0 ? 'increased' : 'decreased',
            startValue: firstValue.toFixed(2),
            endValue: lastValue.toFixed(2)
          };
        }).filter(t => t !== null);

        analysis = trends.map(t => 
          `${t?.metric.replace(/_/g, ' ').toUpperCase()} has ${t?.direction} from ${t?.startValue} to ${t?.endValue} (${Math.abs(Number(t?.change))}% change) over the selected period.`
        ).join('\n\n');

        recommendations = trends.map(t => {
          if (Number(t?.change) < 0) {
            return `Consider implementing improvement measures for ${t?.metric.replace(/_/g, ' ')} as it shows a declining trend. Review processes that might have contributed to this decrease.`;
          } else {
            return `Maintain current practices for ${t?.metric.replace(/_/g, ' ')} as it shows a positive trend. Document successful strategies for future reference.`;
          }
        });

        visualData = {
          type: 'trend',
          data: trends
        };
        break;
      case 'anomaly':
        const anomalies = metricsData.map(metricData => {
          const values = metricData.values.map(v => v.value);
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
          const outliers = metricData.values.filter(v => Math.abs(v.value - mean) > 2 * stdDev);

          return {
            metric: metricData.metric,
            outliers: outliers.map(o => ({
              date: o.timestamp,
              value: o.value,
              deviation: ((o.value - mean) / stdDev).toFixed(2)
            }))
          };
        });

        analysis = anomalies.map(a => 
          `Found ${a.outliers.length} anomalies in ${a.metric.replace(/_/g, ' ').toUpperCase()}.`
        ).join('\n');

        recommendations = anomalies.flatMap(a => 
          a.outliers.map(o => 
            `Investigate ${a.metric.replace(/_/g, ' ')} data point on ${new Date(o.date).toLocaleDateString()} with unusual value ${o.value}.`
          )
        );
        break;
      case 'correlation':
        if (metrics.length >= 2) {
          const correlations = [];
          for (let i = 0; i < metrics.length; i++) {
            for (let j = i + 1; j < metrics.length; j++) {
              const metric1 = metricsData[i];
              const metric2 = metricsData[j];

              // Simple correlation calculation
              const values1 = metric1.values.map(v => v.value);
              const values2 = metric2.values.map(v => v.value);
              const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
              const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

              const correlation = values1.reduce((acc, _, i) => {
                return acc + (values1[i] - mean1) * (values2[i] - mean2);
              }, 0) / Math.sqrt(
                values1.reduce((acc, v) => acc + Math.pow(v - mean1, 2), 0) *
                values2.reduce((acc, v) => acc + Math.pow(v - mean2, 2), 0)
              );

              correlations.push({
                metrics: [metric1.metric, metric2.metric],
                correlation: correlation.toFixed(2)
              });
            }
          }

          analysis = correlations.map(c => 
            `Correlation between ${c.metrics[0].replace(/_/g, ' ')} and ${c.metrics[1].replace(/_/g, ' ')}: ${c.correlation}`
          ).join('\n');

          recommendations = correlations
            .filter(c => Math.abs(parseFloat(c.correlation)) > 0.7)
            .map(c => 
              `Strong ${parseFloat(c.correlation) > 0 ? 'positive' : 'negative'} correlation found between ${c.metrics[0].replace(/_/g, ' ')} and ${c.metrics[1].replace(/_/g, ' ')}. Consider this relationship in future planning.`
            );
        }
        break;
      case 'forecast':
        const forecasts = metricsData.map(metricData => {
          const values = metricData.values.map(v => v.value);
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const trend = (values[values.length - 1] - values[0]) / values.length;
          const forecast = mean + trend * 30; // Simple 30-day forecast

          return {
            metric: metricData.metric,
            currentValue: values[values.length - 1],
            forecastValue: forecast.toFixed(2),
            trend: trend > 0 ? 'increasing' : 'decreasing'
          };
        });

        analysis = forecasts.map(f => 
          `${f.metric.replace(/_/g, ' ').toUpperCase()} is projected to be ${f.forecastValue} in 30 days (currently ${f.currentValue}).`
        ).join('\n');

        recommendations = forecasts.map(f => {
          if (f.trend === 'decreasing') {
            return `Consider implementing improvement measures for ${f.metric.replace(/_/g, ' ')} to address the projected decline.`;
          } else {
            return `Maintain current practices for ${f.metric.replace(/_/g, ' ')} to sustain the positive trend.`;
          }
        });
        break;
    }

    console.log('Analysis results:', { analysis, recommendations });

    res.json({
      analysis,
      recommendations,
      visualData,
      data: metricsData.map(m => ({
        metric: m.metric,
        values: m.values.map(v => ({
          timestamp: v.timestamp.toISOString(),
          value: v.value
        }))
      }))
    });
  } catch (error) {
    console.error('Error performing analysis:', error);
    res.status(500).json({
      error: 'Failed to perform analysis',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;