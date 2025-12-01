// Barrel export for all server actions
// Domain-driven modular architecture

export {
  createCampaign,
  startCampaign,
  getAllCampaigns,
  updateCampaign,
  deleteCampaign,
  getCampaignLeadCount,
  getCampaignStats,
  getDashboardStats
} from './campaigns';

export {
  processLead,
  getLeads,
  updateLead,
  regenerateEmailDraft
} from './leads';

export {
  sendLeadEmail,
  getInbox,
  analyzeMeetingIntent
} from './email';

export {
  finalizeMeeting,
  finalizeBooking,
  createProposal,
  finalizeMeetingProposal,
  createMeetingAction,
  getAppointments
} from './calendar';
