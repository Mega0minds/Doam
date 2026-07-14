import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, Moon, Monitor, Loader2 } from 'lucide-react';

export function ThemeSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const themes = [
    { 
      value: 'light', 
      label: 'Light', 
      icon: Sun, 
      description: 'A bright and clean interface' 
    },
    { 
      value: 'dark', 
      label: 'Dark', 
      icon: Moon, 
      description: 'Easy on the eyes in low light' 
    },
    { 
      value: 'system', 
      label: 'System', 
      icon: Monitor, 
      description: 'Follows your device settings' 
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Appearance</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Choose how DoAm looks to you. Select a theme preference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={theme} 
            onValueChange={setTheme}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.value;
              return (
                <div key={t.value}>
                  <RadioGroupItem 
                    value={t.value} 
                    id={`theme-${t.value}`} 
                    className="peer sr-only" 
                  />
                  <Label
                    htmlFor={`theme-${t.value}`}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`p-3 rounded-full ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-center">
                      <span className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>
                        {t.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                        {t.description}
                      </p>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current theme</p>
              <p className="text-xs text-muted-foreground">
                {resolvedTheme === 'dark' ? 'Dark mode is active' : 'Light mode is active'}
              </p>
            </div>
            <div className={`p-2 rounded-full ${resolvedTheme === 'dark' ? 'bg-indigo-500/20' : 'bg-amber-500/20'}`}>
              {resolvedTheme === 'dark' ? (
                <Moon className="h-5 w-5 text-indigo-400" />
              ) : (
                <Sun className="h-5 w-5 text-amber-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
