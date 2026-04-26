'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { ServerActionResult, StaffMember } from '@/types';
import { withErrorHandling } from '@/lib/server-utils';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { staffLoginRateLimiter } from '@/lib/ratelimit';

const STAFF_SESSION_COOKIE = 'staff_session';
const JWT_SECRET = new TextEncoder().encode(
    process.env.STAFF_JWT_SECRET || 'fallback-secret-for-dev-only-change-in-prod'
);

export async function loginStaff(
    tenantId: string, 
    staffId: string, 
    pin: string
): Promise<ServerActionResult<StaffMember>> {
    return withErrorHandling(async () => {
        // 0. Rate Limit
        const { success: rateLimitOk } = await staffLoginRateLimiter.limit(`login:${tenantId}:${staffId}`);
        if (!rateLimitOk) {
            throw new Error("Too many login attempts. Please try again in 5 minutes.");
        }

        // 1. Fetch staff member
        const { data: staff, error } = await supabaseAdmin
            .from('tenant_staff')
            .select('*')
            .eq('id', staffId)
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
            .single();

        if (error || !staff) throw new Error("Invalid staff member or inactive account");

        // 2. Verify PIN
        const isValid = await bcrypt.compare(pin, staff.pin_hash);
        if (!isValid) throw new Error("Incorrect PIN");

        // 3. Create Signed JWT
        const sessionData = {
            id: staff.id,
            tenant_id: staff.tenant_id,
            role: staff.role
        };

        const token = await new SignJWT(sessionData)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('12h')
            .sign(JWT_SECRET);

        // 4. Set Session Cookie
        const cookieStore = await cookies();
        cookieStore.set(STAFF_SESSION_COOKIE, token, {
            maxAge: 3600 * 12, // 12 hours (shift length)
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax'
        });

        return staff as StaffMember;
    }, "loginStaff");
}

export async function logoutStaff() {
    const cookieStore = await cookies();
    cookieStore.delete(STAFF_SESSION_COOKIE);
    return { success: true };
}

export async function getAuthenticatedStaff(): Promise<StaffMember | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get(STAFF_SESSION_COOKIE);
    
    if (!session?.value) return null;

    try {
        // Verify JWT
        const { payload } = await jwtVerify(session.value, JWT_SECRET);
        const data = payload as any;

        // Verify still exists and active in DB
        const { data: staff } = await supabaseAdmin
            .from('tenant_staff')
            .select('id, name, waiter_id, role, status, tenant_id, assigned_tables')
            .eq('id', data.id)
            .eq('tenant_id', data.tenant_id) // Extra safety check
            .eq('status', 'active')
            .single();
        
        return staff as StaffMember;
    } catch (err) {
        console.error('[Auth] Staff token verification failed:', err);
        return null;
    }
}
