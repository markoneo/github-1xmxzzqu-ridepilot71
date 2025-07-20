import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  Car, 
  Clock, 
  Phone, 
  Calendar, 
  DollarSign,
  LogOut,
  Navigation,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from 'lucide-react';

interface DriverProject {
  id: string;
  company_id: string;
  company_name: string;
  client_name: string;
  client_phone: string;
  pickup_location: string;
  dropoff_location: string;
  date: string;
  time: string;
  passengers: number;
  price: number;
  driver_fee?: number;
  status: string;
  description: string;
  booking_id: string;
  car_type_name: string;
}

interface DriverDashboardProps {
  driverId: string;
  driverName: string;
  driverUuid: string;
  onLogout: () => void;
}

export default function DriverDashboard({ driverId, driverName, driverUuid, onLogout }: DriverDashboardProps) {
  const [projects, setProjects] = useState<DriverProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch driver's assigned projects
  const fetchDriverProjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching projects for driver UUID:', driverUuid);

      // Use API endpoint to fetch driver projects (bypasses RLS)
      const response = await fetch(`/api/driver/${driverUuid}/projects`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        setError(errorData.error || 'Failed to load your assigned trips');
        return;
      }

      const { projects } = await response.json();

      console.log('Fetched driver projects:', projects);
      setProjects(projects || []);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error in fetchDriverProjects:', err);
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverProjects();
    
    // Set up auto-refresh every 2 minutes
    const interval = setInterval(fetchDriverProjects, 120000);
    return () => clearInterval(interval);
  }, [driverUuid]);

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleManualRefresh = () => {
    fetchDriverProjects();
  };

  const getUrgencyStatus = (project: DriverProject) => {
    const now = new Date();
    const projectDateTime = new Date(`${project.date}T${project.time}`);
    const hoursUntil = (projectDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntil <= 0) return { status: 'overdue', color: 'red', message: 'Overdue' };
    if (hoursUntil <= 2) return { status: 'urgent', color: 'orange', message: 'Starting Soon' };
    if (hoursUntil <= 24) return { status: 'today', color: 'blue', message: 'Today' };
    return { status: 'scheduled', color: 'gray', message: 'Scheduled' };
  };

  const formatDate = (date: string) => {
    const today = new Date();
    const projectDate = new Date(date);
    
    if (projectDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (projectDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    return projectDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  // Group projects by date
  const groupedProjects = projects.reduce((groups, project) => {
    const dateKey = project.date;
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(project);
    return groups;
  }, {} as Record<string, DriverProject[]>);

  const sortedDateKeys = Object.keys(groupedProjects).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p>Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold">Welcome, {driverName}</h1>
                <p className="text-blue-200 text-sm">Driver ID: {driverId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRefresh}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Refresh trips"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <button
                onClick={onLogout}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-200">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-300" />
              <span className="text-white text-sm">Today's Trips</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {groupedProjects[new Date().toISOString().split('T')[0]]?.length || 0}
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-300" />
              <span className="text-white text-sm">Total Earnings</span>
            </div>
            <div className="text-2xl font-bold text-white">
              €{projects.reduce((sum, p) => sum + (p.driver_fee || p.price), 0).toFixed(0)}
            </div>
          </div>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center border border-white/20">
            <Calendar className="w-12 h-12 text-white/50 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No trips assigned</h3>
            <p className="text-blue-200">Check back later for new assignments</p>
            <p className="text-blue-300 text-sm mt-2">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDateKeys.map(dateKey => {
              const dateProjects = groupedProjects[dateKey];
              
              return (
                <div key={dateKey} className="space-y-3">
                  {/* Date Header */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <h2 className="text-white font-semibold text-lg">
                      {formatDate(dateKey)}
                    </h2>
                    <p className="text-blue-200 text-sm">
                      {dateProjects.length} trip{dateProjects.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Projects for this date */}
                  {dateProjects.map(project => {
                    const urgency = getUrgencyStatus(project);
                    const isExpanded = expandedProjects.has(project.id);
                    const displayPrice = project.driver_fee || project.price;

                    return (
                      <div 
                        key={project.id} 
                        className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden"
                      >
                        {/* Trip Header */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                urgency.color === 'red' ? 'bg-red-400' :
                                urgency.color === 'orange' ? 'bg-orange-400' :
                                urgency.color === 'blue' ? 'bg-blue-400' : 'bg-gray-400'
                              }`} />
                              <span className={`text-sm font-medium ${
                                urgency.color === 'red' ? 'text-red-200' :
                                urgency.color === 'orange' ? 'text-orange-200' :
                                urgency.color === 'blue' ? 'text-blue-200' : 'text-gray-200'
                              }`}>
                                {urgency.message}
                              </span>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-300">
                                €{displayPrice.toFixed(2)}
                              </div>
                              {project.booking_id && (
                                <div className="text-xs text-blue-200">
                                  #{project.booking_id}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Time and Company */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-blue-300" />
                              <span className="text-white text-xl font-bold">
                                {formatTime(project.time)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-300" />
                              <span className="text-blue-200 text-sm">
                                {project.company_name}
                              </span>
                            </div>
                          </div>

                          {/* Client Info */}
                          <div className="mb-3">
                            <h3 className="text-white font-semibold text-lg mb-1">
                              {project.client_name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-green-300" />
                              <a 
                                href={`tel:${project.client_phone}`}
                                className="text-green-300 hover:text-green-200 transition-colors"
                              >
                                {project.client_phone || 'No phone provided'}
                              </a>
                            </div>
                          </div>

                          {/* Route Summary */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-green-200 font-medium">PICKUP</p>
                                <p className="text-white text-sm">{project.pickup_location}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <Navigation className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-red-200 font-medium">DROPOFF</p>
                                <p className="text-white text-sm">{project.dropoff_location}</p>
                              </div>
                            </div>
                          </div>

                          {/* Quick Info */}
                          <div className="flex items-center gap-4 text-sm text-blue-200 mb-4">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{project.passengers} passenger{project.passengers !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Car className="w-4 h-4" />
                              <span>{project.car_type_name}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-3">
                            {/* Call Client */}
                            <a
                              href={`tel:${project.client_phone}`}
                              className="flex items-center gap-2 flex-1 bg-green-500/80 hover:bg-green-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                            >
                              <Phone className="w-5 h-5" />
                              Call Client
                            </a>

                            {/* WhatsApp */}
                            <a
                              href={`https://wa.me/${project.client_phone?.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(project.client_name)}%2C%20this%20is%20your%20driver%20${encodeURIComponent(driverName)}.%20I%20will%20be%20picking%20you%20up%20at%20${project.time}%20from%20${encodeURIComponent(project.pickup_location)}.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 flex-1 bg-green-600/80 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                            >
                              <MessageCircle className="w-5 h-5" />
                              WhatsApp
                            </a>

                            {/* Expand/Collapse */}
                            <button
                              onClick={() => toggleProjectExpanded(project.id)}
                              className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t border-white/20 bg-white/5 p-4">
                            {project.description && (
                              <div className="mb-4">
                                <h4 className="text-blue-200 text-sm font-medium mb-2">Special Instructions</h4>
                                <p className="text-white text-sm bg-white/10 p-3 rounded-lg">
                                  {project.description}
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-blue-200 mb-1">Trip Details</p>
                                <div className="space-y-1 text-white">
                                  <p>Date: {formatDate(project.date)}</p>
                                  <p>Time: {formatTime(project.time)}</p>
                                  <p>Vehicle: {project.car_type_name}</p>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-blue-200 mb-1">Payment Info</p>
                                <div className="space-y-1 text-white">
                                  <p>Your Fee: €{displayPrice.toFixed(2)}</p>
                                  {project.driver_fee && project.driver_fee !== project.price && (
                                    <p className="text-xs text-blue-200">
                                      (Total: €{project.price.toFixed(2)})
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Navigation Actions */}
                            <div className="mt-4 space-y-2">
                              <a
                                href={`https://maps.google.com/maps?daddr=${encodeURIComponent(project.pickup_location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 w-full bg-blue-500/80 hover:bg-blue-500 text-white py-2 px-4 rounded-lg transition-colors"
                              >
                                <Navigation className="w-4 h-4" />
                                Navigate to Pickup
                              </a>
                              
                              <a
                                href={`https://maps.google.com/maps?daddr=${encodeURIComponent(project.dropoff_location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 w-full bg-purple-500/80 hover:bg-purple-500 text-white py-2 px-4 rounded-lg transition-colors"
                              >
                                <Navigation className="w-4 h-4" />
                                Navigate to Dropoff
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-blue-200 text-sm">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
          <p className="text-blue-300 text-xs mt-1">
            RidePilot Driver Portal v1.0
          </p>
        </div>
      </div>
    </div>
  );
}