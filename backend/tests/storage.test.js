import { describe, expect, it } from 'vitest';
import { SupabaseStorageProvider } from '../src/adapters/storage/supabase-storage-provider.js';

describe('SupabaseStorageProvider', () => {
  it.each([
    'https://abc.supabase.co',
    'https://abc.supabase.co/',
    'https://abc.supabase.co/rest/v1/',
  ])('usa solo el origen de SUPABASE_URL (%s)', (url) => {
    const storage = new SupabaseStorageProvider({ url, serviceRoleKey: 'k', bucket: 'productos' });
    expect(storage.prefijoPublico).toBe(
      'https://abc.supabase.co/storage/v1/object/public/productos/',
    );
  });

  it('reconoce las URL de su bucket y no las externas (Unsplash del seed)', () => {
    const storage = new SupabaseStorageProvider({
      url: 'https://abc.supabase.co',
      serviceRoleKey: 'k',
      bucket: 'productos',
    });
    expect(
      storage.rutaDesdeUrl('https://abc.supabase.co/storage/v1/object/public/productos/1/a.png'),
    ).toBe('1/a.png');
    expect(storage.rutaDesdeUrl('https://images.unsplash.com/photo-1')).toBeNull();
  });
});
