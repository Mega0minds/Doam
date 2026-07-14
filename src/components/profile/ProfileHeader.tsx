import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Loader2, User, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProfileHeaderProps {
  email: string | null;
  biography: string | null;
  biographyUpdatedAt: string | null;
  isRegenerating: boolean;
  onRegenerate: () => void;
}

export function ProfileHeader({ 
  email, 
  biography, 
  biographyUpdatedAt,
  isRegenerating, 
  onRegenerate 
}: ProfileHeaderProps) {
  const { language } = useLanguage();
  
  const getInitials = (email: string | null) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-elevated">
              <AvatarFallback className="text-3xl font-bold gradient-primary text-primary-foreground">
                {getInitials(email)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-soft">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>

            {/* AI Biography */}
            <div className="relative">
              {biography ? (
                <p className="text-sm leading-relaxed text-foreground/90 italic">
                  "{biography}"
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {language === 'pidgin' 
                    ? 'Complete your goals make we generate your profile.'
                    : 'Complete your goals to generate your AI profile.'}
                </p>
              )}
              {biographyUpdatedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  {language === 'pidgin' ? 'Last update:' : 'Last updated:'} {new Date(biographyUpdatedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Regenerate Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="gap-2"
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {language === 'pidgin' ? 'Refresh Profile' : 'Regenerate Biography'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
