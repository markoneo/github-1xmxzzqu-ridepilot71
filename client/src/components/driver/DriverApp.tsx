import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DriverLogin from './DriverLogin';
import DriverDashboard from './DriverDashboard';

export default function DriverApp() {
  const [driver, setDriver] = useState<{id: string, name: string, uuid: string} | null>(null);
  const [searchParams] = useSearchParams();
  const [tokenChecked, setTokenChecked] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  const handleDriverLogin = (driverId: string, driverName: string, driverUuid: string) => {
    setDriver({ id: driverId, name: driverName, uuid: driverUuid });
  };

  const handleDriverLogout = () => {
    setDriver(null);
  };

  // Check for token authentication on mount
  React.useEffect(() => {
    const token = searchParams.get('token');
    
    if (token && !tokenChecked) {
      setTokenChecked(true);
      
      // Authenticate using token
      fetch(`/api/driver/auth/${token}`)
        .then(response => response.json())
        .then(result => {
          if (result.success && result.driver) {
            handleDriverLogin(result.driver.id, result.driver.name, result.driver.uuid);
          }
        })
        .catch(error => {
          console.error('Token authentication failed:', error);
        });
    } else if (!token) {
      setTokenChecked(true);
    }
  }, [searchParams, tokenChecked]);

  if (!tokenChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p>Checking credentials...</p>
        </div>
      </div>
    );
  }

  // Check for token authentication on mount
  React.useEffect(() => {
    const token = searchParams.get('token');
    
    if (token && !tokenChecked) {
      setTokenChecked(true);
      
      // Authenticate using token
      fetch(`/api/driver/auth/${token}`)
        .then(response => response.json())
        .then(result => {
          if (result.success && result.driver) {
            handleDriverLogin(result.driver.id, result.driver.name, result.driver.uuid);
          }
        })
        .catch(error => {
          console.error('Token authentication failed:', error);
        });
    } else if (!token) {
      setTokenChecked(true);
    }
  }, [searchParams, tokenChecked]);

  if (!tokenChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p>Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return <DriverLogin onDriverLogin={handleDriverLogin} />;
  }

  return (
    <DriverDashboard 
      driverId={driver.id}
      driverName={driver.name}
      driverUuid={driver.uuid}
      onLogout={handleDriverLogout}
    />
  );
}