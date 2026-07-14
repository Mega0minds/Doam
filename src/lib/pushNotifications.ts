import { supabase } from '@/integrations/supabase/client';

// Fallback public VAPID key (overridden by server response from
// get-vapid-public-key so the client and server always agree).
export const VAPID_PUBLIC_KEY =
  'BDFqRHiPA-Fe9XvX98P0Kwo2NhK4-5K3yveAOhegvgzkO8HgCnIAAmqYP-Lkt6q8_XyVRKhrK0LMGmzD7AxVJ2A';

export const NOTIFY_PROMPT_KEY = 'doam-notify-prompted-at';
export const NOTIFY_DEFERRED_KEY = 'doam-notify-deferred';

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) view[i] = rawData.charCodeAt(i);
  return view;
}

async function fetchServerVapidKey(): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
    if (error) {
      console.warn('[push] could not fetch server VAPID key, using fallback', error);
      return VAPID_PUBLIC_KEY;
    }
    const key = (data as any)?.key;
    if (!key) return VAPID_PUBLIC_KEY;
    if (key !== VAPID_PUBLIC_KEY) {
      console.warn('[push] server VAPID key differs from hardcoded fallback — using server key');
    }
    return key;
  } catch (e) {
    console.warn('[push] VAPID key fetch threw', e);
    return VAPID_PUBLIC_KEY;
  }
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[push] serviceWorker not supported');
    return null;
  }
  let reg = await navigator.serviceWorker.getRegistration('/');
  if (!reg) {
    try {
      console.log('[push] registering /sw.js');
      reg = await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      console.error('[push] sw register failed', e);
      return null;
    }
  }
  await navigator.serviceWorker.ready;
  console.log('[push] sw ready, scope:', reg.scope);
  return reg;
}


export async function requestPermissionAndSubscribe(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (!isPushSupported()) {
    console.warn('[push] not supported on this device/browser');
    return { ok: false, reason: 'unsupported' };
  }

  console.log('[push] requesting permission…');
  const permission = await Notification.requestPermission();
  console.log('[push] permission =', permission);
  if (permission !== 'granted') return { ok: false, reason: permission };

  const reg = await getRegistration();
  if (!reg) return { ok: false, reason: 'no-sw' };

  const vapidKey = await fetchServerVapidKey();
  console.log('[push] using VAPID public key prefix:', vapidKey.slice(0, 12) + '…');

  let subscription = await reg.pushManager.getSubscription();
  if (subscription) {
    // If the existing subscription was made with a different key, replace it.
    const existingKey = subscription.options?.applicationServerKey;
    if (existingKey) {
      const existingB64 = btoa(String.fromCharCode(...new Uint8Array(existingKey)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      if (existingB64 !== vapidKey) {
        console.log('[push] VAPID key changed — unsubscribing old subscription');
        try { await subscription.unsubscribe(); } catch {}
        subscription = null;
      }
    }
  }
  if (!subscription) {
    try {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      console.log('[push] subscribed:', subscription.endpoint);
    } catch (e) {
      console.error('[push] subscribe() failed', e);
      return { ok: false, reason: 'subscribe-failed' };
    }
  } else {
    console.log('[push] reusing existing subscription:', subscription.endpoint);
  }

  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh ?? '';
  const auth = json.keys?.auth ?? '';
  const endpoint = subscription.endpoint;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'not-authenticated' };

  const { error: subErr } = await supabase
    .from('push_subscriptions' as any)
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent.slice(0, 200),
      },
      { onConflict: 'endpoint' }
    );
  if (subErr) {
    console.error('[push] failed to save subscription', subErr);
    return { ok: false, reason: subErr.message };
  }
  console.log('[push] subscription saved to push_subscriptions');


  // Ensure preferences row exists
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';
  await supabase
    .from('notification_preferences' as any)
    .upsert(
      { user_id: user.id, enabled: true, timezone: tz },
      { onConflict: 'user_id' }
    );

  return { ok: true };
}

export async function unsubscribePush(): Promise<void> {
  const reg = await getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  const endpoint = sub?.endpoint;
  if (sub) await sub.unsubscribe();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (endpoint) {
    await supabase
      .from('push_subscriptions' as any)
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);
  } else {
    await supabase.from('push_subscriptions' as any).delete().eq('user_id', user.id);
  }

  await supabase
    .from('notification_preferences' as any)
    .upsert({ user_id: user.id, enabled: false }, { onConflict: 'user_id' });
}

export function shouldShowNotifyPrompt(): boolean {
  if (!isPushSupported()) return false;
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return false;
  const deferredAt = localStorage.getItem(NOTIFY_DEFERRED_KEY);
  if (!deferredAt) return true;
  const days = (Date.now() - Number(deferredAt)) / (1000 * 60 * 60 * 24);
  return days >= 3;
}

export function deferNotifyPrompt(): void {
  localStorage.setItem(NOTIFY_DEFERRED_KEY, String(Date.now()));
}

export function clearDefer(): void {
  localStorage.removeItem(NOTIFY_DEFERRED_KEY);
}

export async function sendTestNotification(): Promise<{ ok: boolean; info?: any; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-test-notification');
    if (error) {
      console.error('[push] test send failed', error);
      return { ok: false, error: error.message };
    }
    console.log('[push] test result', data);
    const sent = (data as any)?.sent ?? 0;
    return { ok: sent > 0, info: data };
  } catch (e: any) {
    console.error('[push] test threw', e);
    return { ok: false, error: e?.message ?? String(e) };
  }
}

