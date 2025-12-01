import React, { useState, useEffect } from 'react';
import { Plus, Edit2, RotateCw, Loader2, X, Target, Trash2 } from 'lucide-react';
import { getAllCampaigns, createCampaign, startCampaign, updateCampaign, deleteCampaign } from '../../actions';
import CreateCampaignForm from './CreateCampaignForm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Campaign {
    id: string;
    name: string;
    industry?: string;
    status: string;
    created_at: string;
    target_location?: string;
    icp_description: string;
    value_prop: string;
    target_company_size?: string;
    target_persona?: string;
    pain_points?: string[];
    tech_stack_filter?: string[];
}

interface CampaignsViewProps {
    onCampaignCreated: (id: string) => void;
    onCampaignDeleted?: () => void;
    userId: string;
}

export default function CampaignsView({ onCampaignCreated, onCampaignDeleted, userId }: CampaignsViewProps) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [formData, setFormData] = useState({
        industry: '',
        companySize: '',
        location: '',
        icpDescription: '',
        painPoints: '',
        valueProp: '',
        techStack: ''
    });

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        const result = await getAllCampaigns(userId);
        if (result.success && result.campaigns) {
            setCampaigns(result.campaigns);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setMessage(null);
    };

    const handleEdit = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setFormData({
            industry: campaign.industry || '',
            companySize: campaign.target_company_size || '',
            location: campaign.target_location || '',
            icpDescription: campaign.icp_description,
            painPoints: '',
            valueProp: campaign.value_prop,
            techStack: ''
        });
        setShowForm(true);
    };

    const handleRerun = async (campaignId: string) => {
        setIsLoading(true);
        const result = await startCampaign(campaignId);
        setIsLoading(false);

        if (result.success) {
            setMessage({ type: 'success', text: `Campaign restarted! Found ${result.count} leads.` });
            onCampaignCreated(campaignId);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to restart campaign' });
        }
    };

    const handleDelete = async (campaignId: string, campaignName: string) => {
        if (!confirm(`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`)) {
            return;
        }

        setIsLoading(true);
        const result = await deleteCampaign(campaignId);
        setIsLoading(false);

        if (result.success) {
            setMessage({ type: 'success', text: 'Campaign deleted successfully' });
            fetchCampaigns();
            // Notify parent component to refresh its campaign list
            if (onCampaignDeleted) {
                onCampaignDeleted();
            }
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to delete campaign' });
        }
    };

    const handleSubmit = async () => {
        if (!formData.industry || !formData.icpDescription || !formData.valueProp) {
            setMessage({ type: 'error', text: 'Please fill in all required fields' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            if (editingCampaign) {
                // Update existing campaign
                const updateRes = await updateCampaign(editingCampaign.id, {
                    name: `${formData.industry} Campaign`,
                    icp_description: formData.icpDescription,
                    value_prop: formData.valueProp,
                    industry: formData.industry,
                    target_location: formData.location,
                    target_company_size: formData.companySize
                } as any);

                if (!updateRes.success) {
                    throw new Error(updateRes.error || 'Failed to update campaign');
                }

                setMessage({ type: 'success', text: 'Campaign updated successfully!' });
                fetchCampaigns();
                setShowForm(false);
                setEditingCampaign(null);
            } else {
                // Create new campaign
                const createRes = await createCampaign('11111111-1111-1111-1111-111111111111', {
                    name: `${formData.industry} Campaign`,
                    icp_description: formData.icpDescription,
                    value_prop: formData.valueProp,
                    tech_stack_filter: formData.techStack ? formData.techStack.split(',').map(s => s.trim()) : [],
                    target_persona: 'Decision Maker',
                    industry: formData.industry,
                    target_location: formData.location,
                    target_company_size: formData.companySize
                } as any);

                if (!createRes.success || !createRes.campaign) {
                    throw new Error(createRes.error || 'Failed to create campaign');
                }

                // Start campaign
                const startRes = await startCampaign(createRes.campaign.id);
                if (!startRes.success) {
                    throw new Error(startRes.error || 'Failed to start campaign');
                }

                setMessage({ type: 'success', text: `Campaign created! Found ${startRes.count} leads.` });
                onCampaignCreated(createRes.campaign.id);
                setShowForm(false);
                fetchCampaigns();
            }

            // Reset form
            setFormData({
                industry: '',
                companySize: '',
                location: '',
                icpDescription: '',
                painPoints: '',
                valueProp: '',
                techStack: ''
            });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    if (showForm) {
        return (
            <CreateCampaignForm
                onClose={() => {
                    setShowForm(false);
                    setEditingCampaign(null);
                }}
                onSuccess={(campaignId) => {
                    setShowForm(false);
                    setEditingCampaign(null);
                    setMessage({ type: 'success', text: editingCampaign ? 'Campaign updated successfully!' : 'Campaign created successfully!' });
                    fetchCampaigns();
                    onCampaignCreated(campaignId);
                }}
                editMode={editingCampaign ? {
                    campaignId: editingCampaign.id,
                    existingData: {
                        name: editingCampaign.name || '',
                        industry: editingCampaign.industry || '',
                        location: editingCampaign.target_location || '',
                        companySize: editingCampaign.target_company_size || '',
                        icpDescription: editingCampaign.icp_description || '',
                        valueProp: editingCampaign.value_prop || '',
                        targetPersona: editingCampaign.target_persona || '',
                        painPoints: editingCampaign.pain_points?.join(', ') || '',
                        techStack: editingCampaign.tech_stack_filter || []
                    }
                } : undefined}
            />
        );
    }

    return (
        <div className="min-h-full">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-white">Your Campaigns</h3>
                    <p className="text-sm text-slate-400 mt-1">Manage and monitor your outbound campaigns</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                >
                    <Plus size={20} />
                    New Campaign
                </button>
            </div>

            {message && (
                <div className={cn(
                    "mb-6 p-4 rounded-lg border",
                    message.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                    message.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-400"
                )}>
                    {message.text}
                </div>
            )}

            {campaigns.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center text-slate-500">
                    <Target className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No campaigns yet</p>
                    <p className="text-sm mb-4">Create your first campaign to start generating leads</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                    >
                        Create Campaign
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map(campaign => (
                        <div
                            key={campaign.id}
                            className="bg-slate-900/50 border border-white/10 rounded-xl p-6 hover:border-indigo-500/30 transition-all backdrop-blur-sm"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="font-semibold text-white text-lg">{campaign.name}</h4>
                                    <p className="text-sm text-slate-400 mt-1">{campaign.industry || 'General'}</p>
                                </div>
                                <span className={cn(
                                    "px-2 py-1 rounded-full text-[10px] font-medium",
                                    campaign.status === 'ACTIVE' && "bg-emerald-500/10 text-emerald-400",
                                    campaign.status === 'PAUSED' && "bg-yellow-500/10 text-yellow-400",
                                    campaign.status === 'DRAFT' && "bg-slate-500/10 text-slate-400"
                                )}>
                                    {campaign.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Location</span>
                                    <span className="text-slate-300">{campaign.target_location || 'Any'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Created</span>
                                    <span className="text-slate-300">{new Date(campaign.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handleEdit(campaign)}
                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                    <Edit2 size={14} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleRerun(campaign.id)}
                                    disabled={isLoading}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    <RotateCw size={14} />
                                    Re-run
                                </button>
                                <button
                                    onClick={() => handleDelete(campaign.id, campaign.name)}
                                    className="px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
