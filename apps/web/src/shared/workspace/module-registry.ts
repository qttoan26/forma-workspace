export type WorkspaceModuleStatus = 'available' | 'implementation'

export type WorkspaceModule = {
  id: string
  label: string
  description: string
  path: string
  status: WorkspaceModuleStatus
  eyebrow: string
}

export const workspaceModules: WorkspaceModule[] = [
  {
    id: 'work',
    label: 'Work',
    description: 'Projects, tasks, priorities, ownership, and cross-team execution.',
    path: '/modules/work',
    status: 'available',
    eyebrow: 'Execution',
  },
  {
    id: 'production',
    label: 'Production',
    description: 'Operational queues, production stages, workload, and delivery visibility.',
    path: '/modules/production',
    status: 'implementation',
    eyebrow: 'Operations',
  },
  {
    id: 'documents',
    label: 'Documents & Data',
    description: 'Document intake, OCR, structured data, review, and traceable handoffs.',
    path: '/modules/documents',
    status: 'implementation',
    eyebrow: 'Digitization',
  },
  {
    id: 'automation',
    label: 'Automation',
    description: 'Reusable workflows, triggers, approvals, and automation monitoring.',
    path: '/modules/automation',
    status: 'implementation',
    eyebrow: 'Automation',
  },
  {
    id: 'vendors',
    label: 'Vendors',
    description: 'Vendor collaboration, outsourced work, assignments, and delivery tracking.',
    path: '/modules/vendors',
    status: 'implementation',
    eyebrow: 'External work',
  },
  {
    id: 'customers',
    label: 'Customers',
    description: 'Customer workspaces, requests, delivery context, and service visibility.',
    path: '/modules/customers',
    status: 'implementation',
    eyebrow: 'Customer operations',
  },
  {
    id: 'governance',
    label: 'Policy & Compliance',
    description: 'SOPs, policies, approvals, audit context, and compliance controls.',
    path: '/modules/governance',
    status: 'implementation',
    eyebrow: 'Governance',
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Organization, access, teams, workspace configuration, and integrations.',
    path: '/modules/admin',
    status: 'implementation',
    eyebrow: 'Platform',
  },
]

export function getWorkspaceModule(moduleId: string) {
  return workspaceModules.find((module) => module.id === moduleId)
}
