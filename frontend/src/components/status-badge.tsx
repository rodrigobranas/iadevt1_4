import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  environment: string;
  memory: {
    used: number;
    total: number;
  };
}

export function StatusBadge() {
  const [status, setStatus] = useState<'healthy' | 'unhealthy' | 'loading' | 'error'>('loading');
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:3005/health');
        if (response.ok) {
          const data = await response.json();
          setHealthData(data);
          setStatus('healthy');
        } else {
          setStatus('unhealthy');
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setStatus('error');
      }
    };

    // Initial check
    checkHealth();

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'unhealthy':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'loading':
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'healthy':
        return 'API Online';
      case 'unhealthy':
        return 'API Degraded';
      case 'error':
        return 'API Offline';
      case 'loading':
      default:
        return 'Checking...';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border">
      <div className="relative">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            getStatusColor()
          )}
        />
        {status === 'healthy' && (
          <div
            className={cn(
              'absolute inset-0 w-2 h-2 rounded-full animate-ping',
              getStatusColor(),
              'opacity-75'
            )}
          />
        )}
      </div>
      <span className="text-sm font-medium text-foreground">
        {getStatusText()}
      </span>
      {healthData && status === 'healthy' && (
        <span className="text-xs text-muted-foreground">
          ({formatUptime(healthData.uptime)})
        </span>
      )}
    </div>
  );
}