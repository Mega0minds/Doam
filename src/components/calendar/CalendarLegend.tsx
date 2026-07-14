import { Lock, Sparkles, Coffee, Shield, Zap, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CalendarLegend = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Schedule Layers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Layer 1: Fixed Commitments */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Lock className="h-3 w-3" />
            Layer 1: Fixed
          </div>
          <div className="pl-5 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-indigo-500/20 border-l-2 border-indigo-500" />
              <span>Sleep</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-blue-500/20 border-l-2 border-blue-500" />
              <span>Class</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-gray-500/20 border-l-2 border-gray-500" />
              <span>Commute</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-pink-500/20 border-l-2 border-pink-500" />
              <span>Family</span>
            </div>
          </div>
        </div>

        {/* Layer 2: Goal Tasks */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Layer 2: Goals
          </div>
          <div className="pl-5 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-primary/20 border-l-2 border-primary" />
              <span>AI Scheduled</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Zap className="h-3 w-3 text-amber-500" />
              <span>Deep Focus</span>
            </div>
          </div>
        </div>

        {/* Layer 3: Energy */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Shield className="h-3 w-3" />
            Layer 3: Energy
          </div>
          <div className="pl-5 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Peak Hours</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Low Energy</span>
            </div>
          </div>
        </div>

        {/* Layer 4: Protected */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Coffee className="h-3 w-3" />
            Layer 4: Rest
          </div>
          <div className="pl-5 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-emerald-500/20 border-l-2 border-emerald-500" />
              <span>Rest Block</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Moon className="h-3 w-3 text-indigo-400" />
              <span>Protected</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarLegend;
