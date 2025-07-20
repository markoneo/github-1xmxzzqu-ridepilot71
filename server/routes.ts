import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabaseServer } from "./lib/supabaseServer";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Driver token-based authentication endpoint
  app.get('/api/driver/auth/:token', async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      // Use service role to find driver by auth token
      const { data: driverData, error } = await supabaseServer
        .from('drivers')
        .select('id, name, phone, license, auth_token')
        .eq('auth_token', token)
        .eq('active', true)
        .maybeSingle();

      if (error) {
        console.error('Database error during token authentication:', error);
        return res.status(500).json({ error: 'Authentication failed' });
      }

      if (!driverData) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Return driver info for successful authentication
      res.json({
        success: true,
        driver: {
          id: driverData.license,
          name: driverData.name,
          uuid: driverData.id,
          phone: driverData.phone
        }
      });

    } catch (err) {
      console.error('Driver token authentication error:', err);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Driver authentication endpoint - independent from main dashboard auth
  app.post('/api/driver/login', async (req, res) => {
    try {
      const { driverId, pin } = req.body;

      if (!driverId || !pin) {
        return res.status(400).json({ error: 'Driver ID and PIN are required' });
      }

      // Use service role to bypass RLS for driver authentication
      const { data: driverData, error } = await supabaseServer
        .from('drivers')
        .select('id, name, phone, license, pin')
        .eq('license', driverId.trim())
        .maybeSingle();

      if (error) {
        console.error('Database error during driver login:', error);
        return res.status(500).json({ error: 'Database error occurred' });
      }

      if (!driverData) {
        return res.status(401).json({ error: 'Invalid Driver ID' });
      }

      // Validate PIN (default to '1234' if no PIN set)
      const validPin = driverData.pin || '1234';
      if (pin.trim() !== validPin) {
        return res.status(401).json({ error: 'Invalid PIN' });
      }

      // Return driver info without sensitive data
      res.json({
        success: true,
        driver: {
          id: driverData.license,
          name: driverData.name,
          uuid: driverData.id,
          phone: driverData.phone
        }
      });

    } catch (err) {
      console.error('Driver authentication error:', err);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Regenerate driver token endpoint
  app.post('/api/driver/regenerate-token/:driverId', async (req, res) => {
    try {
      const { driverId } = req.params;

      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
      }

      // Generate new token using the database function
      const { data, error } = await supabaseServer
        .rpc('generate_driver_token', { driver_uuid: driverId });

      if (error) {
        console.error('Error regenerating driver token:', error);
        return res.status(500).json({ error: 'Failed to regenerate token' });
      }

      res.json({ success: true, newToken: data });

    } catch (err) {
      console.error('Driver token regeneration error:', err);
      res.status(500).json({ error: 'Failed to regenerate token' });
    }
  });

  // Get driver projects endpoint - independent from main dashboard auth
  app.get('/api/driver/:driverUuid/projects', async (req, res) => {
    try {
      const { driverUuid } = req.params;

      if (!driverUuid) {
        return res.status(400).json({ error: 'Driver UUID is required' });
      }

      // Use service role to bypass RLS for driver project access
      const { data: projects, error } = await supabaseServer
        .from('projects')
        .select(`
          id,
          company_id,
          client_name,
          client_phone,
          pickup_location,
          dropoff_location,
          date,
          time,
          passengers,
          price,
          driver_fee,
          status,
          description,
          booking_id,
          companies:company_id (
            name
          ),
          car_types:car_type_id (
            name
          )
        `)
        .eq('driver_id', driverUuid)
        .eq('status', 'active')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching driver projects:', error);
        return res.status(500).json({ error: 'Failed to load projects' });
      }

      // Transform the data
      const transformedProjects = (projects || []).map(project => ({
        id: project.id,
        company_id: project.company_id,
        company_name: project.companies?.name || 'Unknown Company',
        client_name: project.client_name,
        client_phone: project.client_phone,
        pickup_location: project.pickup_location,
        dropoff_location: project.dropoff_location,
        date: project.date,
        time: project.time,
        passengers: project.passengers,
        price: project.price,
        driver_fee: project.driver_fee,
        status: project.status,
        description: project.description || '',
        booking_id: project.booking_id || '',
        car_type_name: project.car_types?.name || 'Standard'
      }));

      res.json({ projects: transformedProjects });

    } catch (err) {
      console.error('Error fetching driver projects:', err);
      res.status(500).json({ error: 'Failed to load projects' });
    }
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}