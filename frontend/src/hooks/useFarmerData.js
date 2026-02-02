import { useState, useEffect, useRef } from 'react';
import { farmerService } from '../services/farmerService';

export function useFarmerData(id, role, onFeedbackViewed, timeFilter) {
  const [farmer, setFarmer] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  // Use refs for callbacks to avoid dependency issues
  const onFeedbackViewedRef = useRef(onFeedbackViewed);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    onFeedbackViewedRef.current = onFeedbackViewed;
  }, [onFeedbackViewed]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch farmer info only once per id/role change
  useEffect(() => {
    let cancelled = false;
    
    const fetchFarmer = async () => {
      try {
        setError('');
        setLoading(true);
        
        // Check cache first (5 minute TTL)
        const cacheKey = `farmer_detail_${id}`;
        const cacheTimeKey = `${cacheKey}_time`;
        const cachedData = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(cacheTimeKey);
        
        // Use cache if less than 5 minutes old
        if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime)) < 300000) {
          const farmerData = JSON.parse(cachedData);
          if (cancelled || !isMountedRef.current) return;
          setFarmer(farmerData);
          
          // Auto-select first sensor device
          if (farmerData?.sensorDevices) {
            const devices = farmerData.sensorDevices.split(',').map(d => d.trim()).filter(Boolean);
            if (devices.length > 0) {
              setSelectedDevice(prev => prev || devices[0]);
            }
          }
          setLoading(false);
          return;
        }
        
        // Fast fetch: Get farmer info first
        const farmerData = await farmerService.getFarmer(id);
        
        if (cancelled || !isMountedRef.current) return;
        
        setFarmer(farmerData);
        
        // Cache the farmer data
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(farmerData));
          sessionStorage.setItem(cacheTimeKey, Date.now().toString());
        } catch (cacheErr) {
          // Failed to cache farmer data
        }
        
        // Auto-select first sensor device only if not already set
        if (farmerData?.sensorDevices) {
          const devices = farmerData.sensorDevices.split(',').map(d => d.trim()).filter(Boolean);
          if (devices.length > 0) {
            setSelectedDevice(prev => prev || devices[0]);
          }
        }
        
        // Mark feedback as viewed (non-blocking)
        if (role === 'admin' && farmerData?.ministryFeedback && onFeedbackViewedRef.current) {
          farmerService.markFeedbackViewed(id)
            .then(() => {
              if (!cancelled && isMountedRef.current && onFeedbackViewedRef.current) {
                onFeedbackViewedRef.current(id);
              }
            })
            .catch(err => {
              // Error marking feedback as viewed
            });
        }
        
        setLoading(false);
      } catch (err) {
        if (!cancelled && isMountedRef.current) {
          setError(err?.response?.data?.error || 'Failed to load farmer');
          setLoading(false);
        }
      }
    };
    
    fetchFarmer();
    
    return () => {
      cancelled = true;
    };
  }, [id, role]); // Removed onFeedbackViewed from dependencies

  // Separate effect for sensor data with debouncing
  useEffect(() => {
    if (!selectedDevice || !id) return;

    const controller = new AbortController();
    let timeoutId;
    
    const fetchSensors = async () => {
      try {
        // Fetch with time filter if not 'all', otherwise fetch latest data only
        // Don't include expensive crop safety score or cultivation history here
        const filterParam = timeFilter !== 'all' ? timeFilter : undefined;
        const data = await farmerService.getFarmerWithSensors(
          id, 
          filterParam, 
          selectedDevice,
          controller.signal,
          false, // Don't include crop safety score
          false  // Don't include cultivation history
        );
        
        if (!controller.signal.aborted && isMountedRef.current) {
          if (data?.sensors) {
            setSensors(data.sensors);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          if (isMountedRef.current) {
            // Error loading sensor data
          }
        }
      }
    };
    
    // Debounce sensor fetching by 300ms
    timeoutId = setTimeout(() => {
      fetchSensors();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [id, timeFilter, selectedDevice]); // Removed farmer from dependencies to prevent loops

  return {
    farmer,
    sensors,
    loading,
    error,
    selectedDevice,
    setSelectedDevice,
    setSensors
  };
}
