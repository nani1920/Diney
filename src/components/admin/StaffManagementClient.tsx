'use client';

import { useState } from 'react';
import { StaffMember, StaffRole } from '@/types';
import { createStaff, updateStaff, deleteStaff } from '@/app/actions/staff';
import { 
    Users, 
    UserPlus, 
    Search, 
    MoreHorizontal, 
    Shield, 
    ShieldCheck, 
    ChefHat, 
    Utensils, 
    Trash2, 
    Edit2,
    X,
    Check,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface StaffManagementClientProps {
    initialStaff: StaffMember[];
    tenantId: string;
}

export default function StaffManagementClient({ initialStaff, tenantId }: StaffManagementClientProps) {
    const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        waiter_id: '',
        pin: '',
        role: 'waiter' as StaffRole
    });

    const filteredStaff = staff.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.waiter_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenModal = (member?: StaffMember) => {
        if (member) {
            setEditingStaff(member);
            setFormData({
                name: member.name,
                waiter_id: member.waiter_id,
                pin: '', // Never show existing PIN
                role: member.role
            });
        } else {
            setEditingStaff(null);
            setFormData({
                name: '',
                waiter_id: '',
                pin: '',
                role: 'waiter'
            });
        }
        setIsModalOpen(true);
    };

    const handleToggleStatus = async (member: StaffMember) => {
        const newStatus = member.status === 'active' ? 'inactive' : 'active';
        try {
            const res = await updateStaff(tenantId, member.id, { status: newStatus });
            if (res.success && res.data) {
                setStaff(prev => prev.map(s => s.id === member.id ? (res.data as StaffMember) : s));
                toast.success(`Staff ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
            } else {
                toast.error(res.error || "Failed to update status");
            }
        } catch (err) {
            toast.error("An error occurred");
        }
    };

    const handleDelete = async (member: StaffMember) => {
        if (!confirm(`Are you sure you want to delete ${member.name}?`)) return;
        
        try {
            const res = await deleteStaff(tenantId, member.id);
            if (res.success) {
                setStaff(prev => prev.filter(s => s.id !== member.id));
                toast.success("Staff member deleted");
            } else {
                toast.error(res.error || "Failed to delete staff");
            }
        } catch (err) {
            toast.error("An error occurred");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingStaff) {
                const res = await updateStaff(tenantId, editingStaff.id, formData);
                if (res.success && res.data) {
                    setStaff(prev => prev.map(s => s.id === editingStaff.id ? (res.data as StaffMember) : s));
                    toast.success("Staff updated successfully");
                    setIsModalOpen(false);
                } else {
                    toast.error(res.error || "Failed to update staff");
                }
            } else {
                if (!formData.pin) {
                    toast.error("PIN is required for new staff");
                    setIsSubmitting(false);
                    return;
                }
                const res = await createStaff(tenantId, { ...formData, pin: formData.pin });
                if (res.success && res.data) {
                    setStaff(prev => [res.data as StaffMember, ...prev]);
                    toast.success("Staff member created");
                    setIsModalOpen(false);
                } else {
                    toast.error(res.error || "Failed to create staff");
                }
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRoleIcon = (role: StaffRole) => {
        switch (role) {
            case 'manager': return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
            case 'chef': return <ChefHat className="w-4 h-4 text-orange-600" />;
            case 'waiter': return <Utensils className="w-4 h-4 text-emerald-600" />;
        }
    };

    const RoleBadge = ({ role }: { role: StaffRole }) => (
        <span className={clsx(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            role === 'manager' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
            role === 'chef' ? "bg-orange-50 text-orange-700 border-orange-100" :
            "bg-emerald-50 text-emerald-700 border-emerald-100"
        )}>
            {getRoleIcon(role)}
            {role}
        </span>
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200/50 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3 tracking-tight">
                        <Users className="w-7 h-7 text-green-600" />
                        Staff Management
                    </h1>
                    <p className="text-sm text-neutral-500 font-medium mt-1">Manage your team roles and dashboard access</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-neutral-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-neutral-900/20 active:scale-95"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Staff Member
                </button>
            </header>

            <div className="bg-white rounded-3xl border border-neutral-200/50 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-3">
                    <Search className="w-4 h-4 text-neutral-400 ml-2" />
                    <input 
                        type="text"
                        placeholder="Search by name or Staff ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 flex-1"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/50">
                                <th className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100">Staff Member</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100">Role</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100">ID</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filteredStaff.map((member) => (
                                <tr key={member.id} className="hover:bg-neutral-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-neutral-500 uppercase text-sm border border-neutral-200 shadow-sm">
                                                {member.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-neutral-900 tracking-tight">{member.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <RoleBadge role={member.role} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
                                            {member.waiter_id}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <button 
                                                onClick={() => handleToggleStatus(member)}
                                                className={clsx(
                                                    "w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none flex items-center",
                                                    member.status === 'active' ? "bg-green-500" : "bg-neutral-200"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 absolute mx-1",
                                                    member.status === 'active' ? "translate-x-6" : "translate-x-0"
                                                )} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenModal(member)}
                                                className="p-2 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                                title="Edit Staff"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(member)}
                                                className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                title="Delete Staff"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStaff.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 font-medium text-sm italic">
                                        No staff members found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Creation/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative z-10"
                        >
                            <form onSubmit={handleSubmit}>
                                <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                                            {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                                        </h2>
                                        <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Employee Credentials</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-50 text-neutral-400 hover:bg-neutral-100 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Full Name</label>
                                        <input 
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="e.g. Alex Johnson"
                                            className="w-full h-12 rounded-2xl bg-neutral-50 border-neutral-200 text-sm font-bold placeholder:text-neutral-300 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Staff ID</label>
                                            <input 
                                                required
                                                type="text"
                                                value={formData.waiter_id}
                                                onChange={(e) => setFormData({...formData, waiter_id: e.target.value.toUpperCase()})}
                                                placeholder="e.g. W01"
                                                className="w-full h-12 rounded-2xl bg-neutral-50 border-neutral-200 text-sm font-bold placeholder:text-neutral-300 focus:ring-green-500/20 focus:border-green-500 transition-all uppercase"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Login PIN</label>
                                            <input 
                                                required={!editingStaff}
                                                type="text"
                                                maxLength={4}
                                                pattern="\d{4}"
                                                value={formData.pin}
                                                onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})}
                                                placeholder={editingStaff ? "Leave blank to keep" : "****"}
                                                className="w-full h-12 rounded-2xl bg-neutral-50 border-neutral-200 text-sm font-bold placeholder:text-neutral-300 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Role</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['waiter', 'chef', 'manager'] as StaffRole[]).map((role) => (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, role})}
                                                    className={clsx(
                                                        "py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex flex-col items-center gap-1.5",
                                                        formData.role === role 
                                                            ? "bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20" 
                                                            : "bg-white text-neutral-400 border-neutral-200 hover:border-neutral-300"
                                                    )}
                                                >
                                                    {getRoleIcon(role)}
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {editingStaff && (
                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-amber-900 font-bold leading-relaxed tracking-tight">
                                                Changing the Staff ID or PIN will require the employee to log in again on their dashboard.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 bg-neutral-50/50 flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 h-14 rounded-2xl font-bold text-neutral-400 hover:text-neutral-600 transition-colors uppercase tracking-widest text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 h-14 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/15 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Saving...' : editingStaff ? 'Update Staff' : 'Create Staff'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
