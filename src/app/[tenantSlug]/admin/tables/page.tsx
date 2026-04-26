import { getTenantData } from "../../../actions/tenant";
import { getAdminTables } from "../../../actions/orders";
import TablesClient from "./TablesClient";
import { notFound } from "next/navigation";

export default async function TablesPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params;

    // Fetch tenant data with error handling
    const tenantRes = await getTenantData(tenantSlug);

    // If tenant fetching failed or tenant doesn't exist, show not found or error
    if (!tenantRes?.success || !tenantRes?.data) {
        return notFound();
    }

    const tenant = tenantRes.data;

    // Fetch initial tables for the floor map
    const tablesRes = await getAdminTables(tenant.id);

    // Safety check for tables data
    const initialTables = (tablesRes?.success && Array.isArray(tablesRes?.data))
        ? (tablesRes.data as any[])
        : [];

    return (
        <div className="p-4 md:p-8">
            <TablesClient
                initialTables={initialTables}
                tenantId={tenant.id}
            />
        </div>
    );
}
