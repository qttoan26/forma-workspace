import { workSections } from './work-section-registry'

export type ModuleSection = {
  id: string
  label: string
  description: string
  status: 'available' | 'implementation'
  scope?: string[]
}

const moduleSections: Record<string, ModuleSection[]> = {
  production: [
    {
      id: 'intake',
      label: 'Job intake',
      description:
        'Prepare browser-local work packages from existing tasks and document references.',
      status: 'available',
      scope: ['Work package', 'Processing requirements', 'Source documents'],
    },
    {
      id: 'queue',
      label: 'Production queues',
      description:
        'Review draft and queued packages, priorities, owners and due dates on this browser.',
      status: 'available',
      scope: ['Package priority', 'Operational owners', 'Due dates'],
    },
    {
      id: 'processing',
      label: 'Processing',
      description:
        'Track manual processing and hand off packages for quality review on this browser.',
      status: 'available',
      scope: ['Processing stages', 'Stage ownership', 'Exceptions'],
    },
    {
      id: 'quality',
      label: 'Quality control',
      description:
        'Record manual quality decisions, reviewer notes and rework on this browser.',
      status: 'available',
      scope: ['Review checklist', 'Rejected items', 'Rework'],
    },
    {
      id: 'delivery',
      label: 'Delivery',
      description: 'Review release readiness and hand off approved output.',
      status: 'implementation',
      scope: ['Release checklist', 'Delivery milestones', 'Customer handoff'],
    },
  ],
  documents: [
    {
      id: 'intake',
      label: 'Document intake',
      description:
        'Register source document references and link them to project tasks on this browser.',
      status: 'available',
      scope: ['Reference metadata', 'Source locations', 'Task links'],
    },
    {
      id: 'library',
      label: 'Document library',
      description:
        'Search and manage the current project’s document references on this browser.',
      status: 'available',
      scope: ['Reference search', 'Task links', 'Reference editing'],
    },
    {
      id: 'ocr',
      label: 'OCR & extraction',
      description: 'Extract text and structured fields from documents.',
      status: 'implementation',
      scope: ['Extraction jobs', 'Field mapping', 'Processing errors'],
    },
    {
      id: 'review',
      label: 'Data review',
      description: 'Validate extracted information before approval.',
      status: 'implementation',
      scope: ['Validation rules', 'Corrections', 'Review history'],
    },
    {
      id: 'handoff',
      label: 'Data handoff',
      description: 'Release approved documents and structured output.',
      status: 'implementation',
      scope: ['Approved output', 'Export formats', 'Traceable handoff'],
    },
  ],
  automation: [
    {
      id: 'workflows',
      label: 'Workflows',
      description: 'Define reusable workflows for business operations.',
      status: 'implementation',
      scope: ['Workflow steps', 'Conditions', 'Ownership'],
    },
    {
      id: 'triggers',
      label: 'Triggers',
      description: 'Choose the events that start a workflow.',
      status: 'implementation',
      scope: ['Event sources', 'Trigger conditions', 'Schedules'],
    },
    {
      id: 'approvals',
      label: 'Approvals',
      description: 'Route requests to the right approvers.',
      status: 'implementation',
      scope: ['Approval stages', 'Decision history', 'Escalations'],
    },
    {
      id: 'runs',
      label: 'Run history',
      description: 'Inspect workflow execution and resolve failures.',
      status: 'implementation',
      scope: ['Run status', 'Execution history', 'Retry handling'],
    },
  ],
  vendors: [
    {
      id: 'directory',
      label: 'Vendor directory',
      description: 'Manage BPO partners, suppliers and service capabilities.',
      status: 'implementation',
      scope: ['Partner profile', 'Service capabilities', 'Contact details'],
    },
    {
      id: 'assignments',
      label: 'Assignments',
      description: 'Coordinate outsourced work packages and ownership.',
      status: 'implementation',
      scope: ['Work references', 'Partner ownership', 'Due dates'],
    },
    {
      id: 'deliveries',
      label: 'Vendor deliveries',
      description: 'Review partner submissions and delivery status.',
      status: 'implementation',
      scope: ['Submission review', 'Delivery milestones', 'Accepted output'],
    },
    {
      id: 'access',
      label: 'Partner access',
      description: 'Define what each partner can view and submit.',
      status: 'implementation',
      scope: ['Workspace access', 'Document visibility', 'Partner roles'],
    },
  ],
  customers: [
    {
      id: 'accounts',
      label: 'Customer accounts',
      description: 'Manage customer context and service relationships.',
      status: 'implementation',
      scope: ['Account details', 'Contacts', 'Service scope'],
    },
    {
      id: 'requests',
      label: 'Customer requests',
      description: 'Receive and triage customer requirements.',
      status: 'implementation',
      scope: ['Request intake', 'Triage', 'Internal work references'],
    },
    {
      id: 'services',
      label: 'Service visibility',
      description: 'Show customer-facing delivery progress.',
      status: 'implementation',
      scope: ['Service milestones', 'Delivery updates', 'Approved documents'],
    },
    {
      id: 'follow-up',
      label: 'Follow-up',
      description: 'Track open questions and customer handoff.',
      status: 'implementation',
      scope: ['Open questions', 'Customer feedback', 'Handoff confirmation'],
    },
  ],
  governance: [
    {
      id: 'policies',
      label: 'Policies & SOPs',
      description: 'Keep operating procedures and policies organized.',
      status: 'implementation',
      scope: ['Policy library', 'SOP ownership', 'Review dates'],
    },
    {
      id: 'approvals',
      label: 'Policy approvals',
      description: 'Review and approve policy changes.',
      status: 'implementation',
      scope: ['Review requests', 'Approval decisions', 'Version history'],
    },
    {
      id: 'compliance',
      label: 'Compliance controls',
      description: 'Track obligations and evidence for compliance.',
      status: 'implementation',
      scope: ['Control register', 'Evidence references', 'Review ownership'],
    },
    {
      id: 'audit',
      label: 'Audit history',
      description: 'Review traceable policy and compliance decisions.',
      status: 'implementation',
      scope: ['Decision history', 'Access records', 'Evidence trail'],
    },
  ],
  admin: [
    {
      id: 'organization',
      label: 'Organization',
      description: 'Configure departments and workspace structure.',
      status: 'implementation',
      scope: ['Departments', 'Reporting structure', 'Workspace details'],
    },
    {
      id: 'members',
      label: 'Members',
      description: 'Manage employee accounts and workspace membership.',
      status: 'implementation',
      scope: ['Member directory', 'Invitations', 'Account status'],
    },
    {
      id: 'teams',
      label: 'Teams',
      description: 'Organize teams and their responsibilities.',
      status: 'implementation',
      scope: ['Team membership', 'Team ownership', 'Responsibilities'],
    },
    {
      id: 'access',
      label: 'Roles & permissions',
      description: 'Manage access to modules and sensitive information.',
      status: 'implementation',
      scope: ['Roles', 'Permission scopes', 'Access review'],
    },
    {
      id: 'integrations',
      label: 'Integrations',
      description: 'Configure connections to external services.',
      status: 'implementation',
      scope: [
        'Connected services',
        'Connection settings',
        'Integration status',
      ],
    },
    {
      id: 'settings',
      label: 'Workspace settings',
      description: 'Manage shared workspace preferences.',
      status: 'implementation',
      scope: [
        'Workspace profile',
        'Regional settings',
        'Workspace preferences',
      ],
    },
  ],
}

export function getModuleSections(moduleId: string): ModuleSection[] {
  if (moduleId === 'work')
    return workSections.filter((section) => section.id !== 'teams')
  return moduleSections[moduleId] ?? []
}

export function moduleSectionPath(moduleId: string, sectionId: string) {
  return `/modules/${moduleId}/${sectionId}`
}
