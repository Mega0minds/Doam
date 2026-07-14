import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';

interface AvatarUploadProps {
  userId: string;
  email: string | null;
}

export function AvatarUpload({ userId, email }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { avatarUrl, refresh } = useAvatarUrl(userId);

  const getInitials = () => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .upload(`${userId}/avatar`, file, { upsert: true });

      if (error) throw error;
      refresh();
      toast.success('Profile picture updated!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to upload. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await supabase.storage.from('avatars').remove([`${userId}/avatar`]);
      refresh();
      toast.success('Profile picture removed.');
    } catch {
      toast.error('Failed to remove picture.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Profile Picture</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Upload a photo to personalize your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 border-2 border-primary/20">
            <AvatarImage src={avatarUrl || undefined} alt="Profile" />
            <AvatarFallback className="text-2xl font-bold gradient-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={uploading}
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
