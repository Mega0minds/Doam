import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Globe, Check } from 'lucide-react';
import { toast } from 'sonner';

export function LanguageSettings() {
  const { language, setLanguage, t } = useLanguage();
  const [pending, setPending] = useState<Language>(language);

  // Keep pending in sync if language changes elsewhere
  useEffect(() => {
    setPending(language);
  }, [language]);

  const languages: { value: Language; label: string; description: string }[] = [
    { value: 'en', label: 'English', description: 'Standard English' },
    { value: 'pidgin', label: 'Soft Pidgin', description: 'Nigerian Pidgin (friendly & light)' },
  ];

  const dirty = pending !== language;

  const handleSave = () => {
    setLanguage(pending);
    toast.success(
      pending === 'pidgin'
        ? 'Language don change to Soft Pidgin'
        : 'Language updated to English'
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t.languageSettings}
        </CardTitle>
        <CardDescription>{t.languageDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={pending}
          onValueChange={(value: Language) => setPending(value)}
          className="space-y-3"
        >
          {languages.map((lang) => (
            <div key={lang.value} className="flex items-center space-x-3">
              <RadioGroupItem value={lang.value} id={lang.value} />
              <Label
                htmlFor={lang.value}
                className="flex flex-col cursor-pointer"
              >
                <span className="font-medium">{lang.label}</span>
                <span className="text-sm text-muted-foreground">{lang.description}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={!dirty} className="gap-2">
            <Check className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
