import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Pencil, User, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNickname } from '@/contexts/NicknameContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface NicknameEditorProps {
  userId: string;
}

export function NicknameEditor({ userId }: NicknameEditorProps) {
  const { nickname, refresh, setNickname, loading } = useNickname();
  const { language } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(nickname || '');
  }, [nickname]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error(language === 'pidgin' ? 'Nickname no fit empty.' : 'Nickname cannot be empty.');
      return;
    }

    setSaving(true);
    // Optimistic UI
    const previous = nickname;
    setNickname(trimmed);

    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        { user_id: userId, nickname: trimmed } as any,
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Failed to update nickname:', error);
      setNickname(previous);
      toast.error(language === 'pidgin' ? 'E no save. Try again.' : 'Failed to update nickname.');
    } else {
      toast.success(language === 'pidgin' ? 'Nickname don update!' : 'Nickname updated successfully.');
      setEditing(false);
      // Re-sync from source of truth in the background
      refresh();
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base sm:text-lg">
              {language === 'pidgin' ? 'Your Nickname' : 'Your Nickname'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {language === 'pidgin'
                ? 'How DoAm go call you for the app.'
                : 'How DoAm greets you across the app.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div
            className="flex items-center justify-between gap-3"
            aria-busy="true"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                {language === 'pidgin' ? 'Dey load nickname…' : 'Loading nickname…'}
              </span>
            </div>
            <Button variant="outline" size="sm" disabled className="gap-2 shrink-0 opacity-60">
              <Pencil className="h-4 w-4" />
              {language === 'pidgin' ? 'Edit' : 'Edit'}
            </Button>
          </div>
        ) : !editing ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-medium truncate">
                {nickname || (
                  <span className="text-muted-foreground italic">
                    {language === 'pidgin' ? 'No nickname yet' : 'No nickname set'}
                  </span>
                )}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2 shrink-0">
              <Pencil className="h-4 w-4" />
              {language === 'pidgin' ? 'Edit' : 'Edit'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="nickname-input">
                {language === 'pidgin' ? 'New Nickname' : 'New Nickname'}
              </Label>
              <Input
                id="nickname-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={language === 'pidgin' ? 'Wetin we go call you?' : 'What should we call you?'}
                maxLength={40}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') {
                    setEditing(false);
                    setDraft(nickname || '');
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {language === 'pidgin' ? 'Save Changes' : 'Save Changes'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setDraft(nickname || '');
                }}
                disabled={saving}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                {language === 'pidgin' ? 'Cancel' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NicknameEditor;
