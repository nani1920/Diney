import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

 
const isServer = typeof window === 'undefined';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'qrsaas-auth-token',
    storage: !isServer ? {
      getItem: (key) => {
        const name = key + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
          const c = ca[i].trim();
          if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return null;
      },
      setItem: (key, value) => {
         
        const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || '';
         
        const rootDomain = baseDomain ? `.${baseDomain.split(':')[0]}` : '';
        const domain = rootDomain ? `; Domain=${rootDomain}` : '';
        
        const secure = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${key}=${value}${domain}; Path=/; SameSite=Lax${secure}; Max-Age=31536000`;
      },
      removeItem: (key) => {
        const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || '';
        const rootDomain = baseDomain ? `.${baseDomain.split(':')[0]}` : '';
        const domain = rootDomain ? `; Domain=${rootDomain}` : '';
        
        document.cookie = `${key}=; Path=/; SameSite=Lax${domain}; Max-Age=0`;
      }
    } : undefined
  }
});

 
 
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null as (ReturnType<typeof createClient> | null) as any;
