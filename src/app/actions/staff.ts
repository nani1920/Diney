'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { StaffMember, StaffRole, ServerActionResult } from '@/types';
import { ensureTenantOwner } from '@/lib/auth-utils';
import { withErrorHandling } from '@/lib/server-utils';
import { StaffSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function getStaff(tenantId: string): Promise<ServerActionResult<StaffMember[]>> {
    return withErrorHandling(async () => {
        await ensureTenantOwner(tenantId);
        const { data, error } = await supabaseAdmin
            .from('tenant_staff')
            .select('id, name, waiter_id, role, status, tenant_id, assigned_tables')
            .eq('tenant_id', tenantId)
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data as StaffMember[];
    }, "getStaff");
}

/**
 * Public action for login page - returns ONLY name, id, and waiter_id.
 * No security data included.
 */
export async function getStaffListForLogin(tenantId: string): Promise<ServerActionResult<StaffMember[]>> {
    return withErrorHandling(async () => {
        const { data, error } = await supabaseAdmin
            .from('tenant_staff')
            .select('id, name, waiter_id, role, status')
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data as StaffMember[];
    }, "getStaffListForLogin");
}

export async function createStaff(
    tenantId: string, 
    data: { name: string; waiter_id: string; pin: string; role: StaffRole }
): Promise<ServerActionResult<StaffMember>> {
    return withErrorHandling(async () => {
        await ensureTenantOwner(tenantId);
        
        // 1. Validate Input
        const validatedData = StaffSchema.parse({ ...data, id: undefined });

        if (!/^\d{4}$/.test(data.pin)) {
            throw new Error("PIN must be exactly 4 digits");
        }

        const pinHash = await bcrypt.hash(data.pin, 10);

        const { data: staff, error } = await supabaseAdmin
            .from('tenant_staff')
            .insert({
                tenant_id: tenantId,
                name: validatedData.name,
                waiter_id: validatedData.waiter_id,
                pin_hash: pinHash,
                role: validatedData.role,
                status: validatedData.status,
                assigned_tables: validatedData.assigned_tables || []
            })
            .select('id, name, waiter_id, role, status, tenant_id, assigned_tables')
            .single();

        if (error) {
            if (error.code === '23505') throw new Error("Staff ID already exists for this store.");
            throw error;
        }

        revalidatePath(`/[tenantSlug]/admin/staff`, 'page');
        return staff as StaffMember;
    }, "createStaff");
}

export async function updateStaff(
    tenantId: string,
    staffId: string,
    data: { name?: string; waiter_id?: string; pin?: string; role?: StaffRole; status?: 'active' | 'inactive'; assigned_tables?: string[] }
): Promise<ServerActionResult<StaffMember>> {
    return withErrorHandling(async () => {
        await ensureTenantOwner(tenantId);
        
        // 1. Validate Input (Partial allowed for update)
        const validatedData = StaffSchema.partial().parse(data);

        const updateData: any = {
            tenant_id: tenantId // Ensure we don't move staff between tenants
        };

        if (validatedData.name) updateData.name = validatedData.name;
        if (validatedData.waiter_id) updateData.waiter_id = validatedData.waiter_id;
        if (validatedData.role) updateData.role = validatedData.role;
        if (validatedData.status) updateData.status = validatedData.status;
        if (validatedData.assigned_tables) updateData.assigned_tables = validatedData.assigned_tables;

        if (data.pin) {
            if (!/^\d{4}$/.test(data.pin)) {
                throw new Error("PIN must be exactly 4 digits");
            }
            updateData.pin_hash = await bcrypt.hash(data.pin, 10);
        }

        const { data: staff, error } = await supabaseAdmin
            .from('tenant_staff')
            .update(updateData)
            .eq('id', staffId)
            .eq('tenant_id', tenantId)
            .select('id, name, waiter_id, role, status, tenant_id, assigned_tables')
            .single();

        if (error) throw error;

        revalidatePath(`/[tenantSlug]/admin/staff`, 'page');
        return staff as StaffMember;
    }, "updateStaff");
}

export async function deleteStaff(tenantId: string, staffId: string): Promise<ServerActionResult<boolean>> {
    return withErrorHandling(async () => {
        await ensureTenantOwner(tenantId);
        const { error } = await supabaseAdmin
            .from('tenant_staff')
            .delete()
            .eq('id', staffId)
            .eq('tenant_id', tenantId);

        if (error) throw error;

        revalidatePath(`/[tenantSlug]/admin/staff`, 'page');
        return true;
    }, "deleteStaff");
}
