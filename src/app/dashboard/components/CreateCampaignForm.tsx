'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, Target, Mail, Users, Building2, MapPin, TrendingUp, ChevronDown, HelpCircle } from 'lucide-react';
import { createCampaign, updateCampaign } from '../../actions';
import { createClient } from '@/lib/supabase/client';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const supabase = createClient();

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CreateCampaignFormProps {
    onClose: () => void;
    onSuccess: (campaignId: string) => void;
    editMode?: {
        campaignId: string;
        existingData: {
            name: string;
            industry?: string;
            location?: string;
            companySize?: string;
            icpDescription: string;
            valueProp: string;
            targetPersona?: string;
            painPoints?: string;
            techStack?: string[];
        };
    };
}

const INDUSTRIES = [
    'SaaS',
    'Healthcare',
    'E-commerce',
    'Agency',
    'Fintech',
    'Manufacturing',
    'Real Estate',
    'Education',
    'Other'
];

const COMPANY_SIZES = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '500+'
];

const COMMON_TECH_STACK = [
    'Next.js',
    'React',
    'Shopify',
    'WordPress',
    'AWS',
    'Salesforce',
    'HubSpot',
    'Stripe',
    'Python',
    'Node.js',
    'TypeScript',
    'MongoDB',
    'PostgreSQL'
];

export default function CreateCampaignForm({ onClose, onSuccess, editMode }: CreateCampaignFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form state - initialize from editMode if provided
    const [campaignName, setCampaignName] = useState(editMode?.existingData.name || '');
    const [targetIndustry, setTargetIndustry] = useState(editMode?.existingData.industry || '');
    const [customIndustry, setCustomIndustry] = useState('');
    const [targetLocation, setTargetLocation] = useState(editMode?.existingData.location || '');
    const [companySize, setCompanySize] = useState(editMode?.existingData.companySize || '');
    const [icpDescription, setIcpDescription] = useState(editMode?.existingData.icpDescription || '');
    const [techStackFilter, setTechStackFilter] = useState<string[]>(editMode?.existingData.techStack || []);
    const [customTech, setCustomTech] = useState('');
    const [targetPersona, setTargetPersona] = useState(editMode?.existingData.targetPersona || '');
    const [valueProp, setValueProp] = useState(editMode?.existingData.valueProp || '');
    const [painPoints, setPainPoints] = useState(editMode?.existingData.painPoints || '');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Update form state when editMode changes
    useEffect(() => {
        if (editMode?.existingData) {
            setCampaignName(editMode.existingData.name || '');
            setTargetIndustry(editMode.existingData.industry || '');
            setTargetLocation(editMode.existingData.location || '');
            setCompanySize(editMode.existingData.companySize || '');
            setIcpDescription(editMode.existingData.icpDescription || '');
            setTechStackFilter(editMode.existingData.techStack || []);
            setTargetPersona(editMode.existingData.targetPersona || '');
            setValueProp(editMode.existingData.valueProp || '');
            setPainPoints(editMode.existingData.painPoints || '');
        }
    }, [editMode]);

    const handleTechToggle = (tech: string) => {
        setTechStackFilter(prev =>
            prev.includes(tech)
                ? prev.filter(t => t !== tech)
                : [...prev, tech]
        );
    };

    const handleAddCustomTech = () => {
        if (customTech.trim() && !techStackFilter.includes(customTech.trim())) {
            setTechStackFilter(prev => [...prev, customTech.trim()]);
            setCustomTech('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Get the actual user ID from Supabase session
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (!user) {
                console.error('[CreateCampaign] No user found!');
                setError('You must be logged in to create a campaign');
                setIsSubmitting(false);
                return;
            }

            // Use custom industry if "Other" is selected
            const finalIndustry = targetIndustry === 'Other' ? customIndustry : targetIndustry;

            if (editMode) {
                // UPDATE existing campaign
                const result = await updateCampaign(editMode.campaignId, {
                    name: campaignName,
                    icp_description: icpDescription,
                    value_prop: valueProp,
                    industry: finalIndustry || undefined,
                    target_location: targetLocation || undefined,
                    target_company_size: companySize || undefined,
                    tech_stack_filter: techStackFilter.length > 0 ? techStackFilter : undefined,
                    target_persona: targetPersona || undefined,
                    pain_points: painPoints ? painPoints.split(',').map(p => p.trim()).filter(Boolean) : undefined
                });

                if (result.success) {
                    onSuccess(editMode.campaignId);
                } else {
                    console.error('[UpdateCampaign] Update failed:', result.error);
                    setError(result.error || 'Failed to update campaign');
                }
            } else {
                // CREATE new campaign
                const result = await createCampaign(user.id, {
                    name: campaignName,
                    icp_description: icpDescription,
                    value_prop: valueProp,
                    industry: finalIndustry,
                    target_location: targetLocation,
                    target_company_size: companySize,
                    tech_stack_filter: techStackFilter,
                    target_persona: targetPersona,
                    pain_points: painPoints.split(',').map(p => p.trim()).filter(Boolean)
                });


                if (result.success && result.campaign) {
                    // Don't start the campaign here - let the parent handle it after redirect
                    onSuccess(result.campaign.id);
                } else {
                    console.error('[CreateCampaign] Campaign creation failed:', result.error);
                    setError(result.error || 'Failed to create campaign');
                }
            }
        } catch (err: any) {
            console.error('[CreateCampaign] Exception:', err);
            setError(err.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-600/10 to-purple-600/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{editMode ? 'Edit Campaign' : 'Create New Campaign'}</h2>
                            <p className="text-sm text-slate-400">{editMode ? 'Update your campaign settings' : 'Configure your AI-powered outbound strategy'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Section 1: Basic Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Target className="w-5 h-5" />
                            <h3 className="font-semibold text-white">Campaign Basics</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Campaign Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                placeholder="e.g., Q1 SaaS Outreach"
                                className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Target Industry <span className="text-red-400">*</span>
                                </label>
                                <select
                                    required
                                    value={targetIndustry}
                                    onChange={(e) => {
                                        setTargetIndustry(e.target.value);
                                        if (e.target.value !== 'Other') {
                                            setCustomIndustry('');
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select...</option>
                                    {INDUSTRIES.map(ind => (
                                        <option key={ind} value={ind}>{ind}</option>
                                    ))}
                                </select>
                                {targetIndustry === 'Other' && (
                                    <input
                                        type="text"
                                        required
                                        value={customIndustry}
                                        onChange={(e) => setCustomIndustry(e.target.value)}
                                        placeholder="Enter your industry..."
                                        className="mt-2 w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={targetLocation}
                                    onChange={(e) => setTargetLocation(e.target.value)}
                                    placeholder="e.g., San Francisco, Remote"
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: ICP */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-purple-400">
                            <Building2 className="w-5 h-5" />
                            <h3 className="font-semibold text-white">Ideal Customer Profile</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                ICP Description <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                required
                                value={icpDescription}
                                onChange={(e) => setIcpDescription(e.target.value)}
                                rows={4}
                                placeholder="Describe your perfect customer in detail. E.g., 'Fast-growing B2B SaaS companies with 20-100 employees that sell to enterprise clients and struggle with manual processes...'"
                                className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            />
                        </div>
                    </div>

                    {/* Advanced Targeting Section (Collapsible) */}
                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                        >
                            <TrendingUp className="w-5 h-5" />
                            <h3 className="font-semibold">Advanced Targeting (Optional)</h3>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                        </button>

                        {showAdvanced && (
                            <div className="space-y-4 pl-7 border-l-2 border-slate-700">
                                {/* Company Size */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Company Size
                                    </label>
                                    <select
                                        value={companySize}
                                        onChange={(e) => setCompanySize(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Any Size</option>
                                        {COMPANY_SIZES.map(size => (
                                            <option key={size} value={size}>{size} employees</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tech Stack Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Tech Stack Filter <span className="text-slate-500">(Optional)</span>
                                    </label>
                                    <div className="flex items-start gap-2 mb-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                                        <HelpCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-slate-400">
                                            Use this to find companies using specific software (e.g., "Shopify" for E-commerce, "OpenTable" for Restaurants, "Salesforce" for Enterprise Sales teams).
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {COMMON_TECH_STACK.map(tech => (
                                            <button
                                                key={tech}
                                                type="button"
                                                onClick={() => handleTechToggle(tech)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                                    techStackFilter.includes(tech)
                                                        ? "bg-indigo-600 text-white border border-indigo-500"
                                                        : "bg-slate-800 text-slate-400 border border-white/10 hover:border-indigo-500/50"
                                                )}
                                            >
                                                {tech}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customTech}
                                            onChange={(e) => setCustomTech(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTech())}
                                            placeholder="Add custom technology..."
                                            className="flex-1 px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCustomTech}
                                            className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {techStackFilter.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {techStackFilter.map(tech => (
                                                <span
                                                    key={tech}
                                                    className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-300 text-sm flex items-center gap-2"
                                                >
                                                    {tech}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTechToggle(tech)}
                                                        className="hover:text-red-400"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Outreach Strategy */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Mail className="w-5 h-5" />
                            <h3 className="font-semibold text-white">Outreach Strategy</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Target Persona <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={targetPersona}
                                onChange={(e) => setTargetPersona(e.target.value)}
                                placeholder="e.g., CTO, VP of Marketing, Head of Sales"
                                className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Value Proposition <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                required
                                value={valueProp}
                                onChange={(e) => setValueProp(e.target.value)}
                                rows={3}
                                placeholder="What are you selling? E.g., 'We automate invoice processing to save finance teams 10+ hours per week and reduce errors by 95%'"
                                className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Pain Points (Comma-separated)
                            </label>
                            <input
                                type="text"
                                value={painPoints}
                                onChange={(e) => setPainPoints(e.target.value)}
                                placeholder="e.g., High churn, Slow website, Manual data entry, Compliance risks"
                                className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-slate-900/50">
                    <p className="text-sm text-slate-500">
                        All fields marked with <span className="text-red-400">*</span> are required
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {editMode ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    {editMode ? 'Update Campaign' : 'Create Campaign'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
