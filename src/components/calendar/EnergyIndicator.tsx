import { Zap, Battery, BatteryLow, Sun, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EnergyProfile {
  wake_time?: string;
  sleep_time?: string;
  peak_focus_start?: string;
  peak_focus_end?: string;
  low_energy_start?: string;
  low_energy_end?: string;
  chronotype?: string;
}

interface EnergyIndicatorProps {
  hour: number;
  energyProfile: EnergyProfile | null;
  compact?: boolean;
}

const parseTime = (timeStr?: string): number | null => {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  return parseInt(parts[0]);
};

const EnergyIndicator = ({ hour, energyProfile, compact = false }: EnergyIndicatorProps) => {
  if (!energyProfile) return null;

  const peakStart = parseTime(energyProfile.peak_focus_start);
  const peakEnd = parseTime(energyProfile.peak_focus_end);
  const lowStart = parseTime(energyProfile.low_energy_start);
  const lowEnd = parseTime(energyProfile.low_energy_end);
  const wakeHour = parseTime(energyProfile.wake_time);
  const sleepHour = parseTime(energyProfile.sleep_time);

  // Check if current hour is in peak focus
  const isPeakHour = peakStart !== null && peakEnd !== null && 
    hour >= peakStart && hour < peakEnd;

  // Check if current hour is in low energy
  const isLowEnergyHour = lowStart !== null && lowEnd !== null && 
    hour >= lowStart && hour < lowEnd;

  // Check if outside wake/sleep window
  const isOutsideWindow = (wakeHour !== null && hour < wakeHour) || 
    (sleepHour !== null && hour >= sleepHour);

  if (compact) {
    if (isOutsideWindow) {
      return <Moon className="h-3 w-3 text-indigo-400" />;
    }
    if (isPeakHour) {
      return <Zap className="h-3 w-3 text-green-500" />;
    }
    if (isLowEnergyHour) {
      return <BatteryLow className="h-3 w-3 text-amber-500" />;
    }
    return null;
  }

  if (isOutsideWindow) {
    return (
      <Badge variant="outline" className="text-xs bg-indigo-500/10 border-indigo-500/30">
        <Moon className="h-3 w-3 mr-1" />
        Protected Sleep
      </Badge>
    );
  }

  if (isPeakHour) {
    return (
      <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300">
        <Zap className="h-3 w-3 mr-1" />
        Peak Focus
      </Badge>
    );
  }

  if (isLowEnergyHour) {
    return (
      <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300">
        <BatteryLow className="h-3 w-3 mr-1" />
        Low Energy
      </Badge>
    );
  }

  return null;
};

export default EnergyIndicator;
