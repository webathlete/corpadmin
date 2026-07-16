import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { simulatedLoading } from '../../core/loading.util';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  dept: string;
  email: string;
  status: 'active' | 'away' | 'offline';
  avatar: string;
  avatarColor: string;
  skills: string[];
  performance: number;
  projects: number;
  joined: string;
  location: string;
}

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatExpansionModule, MatBadgeModule, MatTooltipModule, MatMenuModule,
    MatDividerModule, MatProgressBarModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDialogModule,
  ],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
})
export class TeamComponent {
  readonly loading = simulatedLoading();
  search = '';
  selectedDept = '';

  readonly departments = ['Engineering', 'Sales', 'Marketing', 'Operations'];

  readonly deptSummary = [
    { name: 'Engineering', count: 5 },
    { name: 'Sales', count: 4 },
    { name: 'Marketing', count: 3 },
    { name: 'Operations', count: 3 },
  ];

  readonly members: TeamMember[] = [
    { id: 1,  name: 'Sarah Kim',      role: 'Senior Account Executive', dept: 'Sales',       email: 'sarah@corp.com', status: 'active', avatar: 'SK', avatarColor: '#1565C0', skills: ['CRM', 'Negotiation', 'SaaS'], performance: 94, projects: 8,  joined: 'Jan 2022', location: 'New York' },
    { id: 2,  name: 'James Rowe',     role: 'Account Executive',        dept: 'Sales',       email: 'james@corp.com', status: 'active', avatar: 'JR', avatarColor: '#7B1FA2', skills: ['Outreach', 'Excel', 'Salesforce'], performance: 78, projects: 5,  joined: 'Mar 2022', location: 'Chicago' },
    { id: 3,  name: 'Maria Lopez',    role: 'SDR',                      dept: 'Sales',       email: 'maria@corp.com', status: 'away',   avatar: 'ML', avatarColor: '#c0392b', skills: ['Cold Calling', 'HubSpot'], performance: 62, projects: 3,  joined: 'Sep 2023', location: 'Austin' },
    { id: 4,  name: 'Alex Torres',    role: 'Account Executive',        dept: 'Sales',       email: 'alex@corp.com',  status: 'active', avatar: 'AT', avatarColor: '#27ae60', skills: ['Enterprise', 'Demo', 'Contracts'], performance: 82, projects: 6,  joined: 'Feb 2023', location: 'Miami' },
    { id: 5,  name: 'Priya Sharma',   role: 'Lead Engineer',            dept: 'Engineering', email: 'priya@corp.com', status: 'active', avatar: 'PS', avatarColor: '#02A7DF', skills: ['Angular', 'TypeScript', 'AWS'], performance: 96, projects: 12, joined: 'Jul 2021', location: 'SF Bay' },
    { id: 6,  name: 'David Chen',     role: 'Backend Engineer',         dept: 'Engineering', email: 'david@corp.com', status: 'active', avatar: 'DC', avatarColor: '#FF6A1C', skills: ['Node.js', 'PostgreSQL', 'Docker'], performance: 88, projects: 9,  joined: 'Nov 2021', location: 'Seattle' },
    { id: 7,  name: 'Emma Wilson',    role: 'UX Designer',              dept: 'Engineering', email: 'emma@corp.com',  status: 'active', avatar: 'EW', avatarColor: '#8e44ad', skills: ['Figma', 'User Research', 'CSS'], performance: 91, projects: 7,  joined: 'Apr 2022', location: 'London' },
    { id: 8,  name: 'Tom Bradley',    role: 'DevOps Engineer',          dept: 'Engineering', email: 'tom@corp.com',   status: 'offline',avatar: 'TB', avatarColor: '#16a085', skills: ['Kubernetes', 'CI/CD', 'GCP'], performance: 85, projects: 6,  joined: 'Jan 2022', location: 'Remote' },
    { id: 9,  name: 'Nina Park',      role: 'Marketing Manager',        dept: 'Marketing',   email: 'nina@corp.com',  status: 'active', avatar: 'NP', avatarColor: '#e67e22', skills: ['SEO', 'HubSpot', 'Analytics'], performance: 87, projects: 10, joined: 'Jun 2021', location: 'Boston' },
    { id: 10, name: 'Ryan Patel',     role: 'Content Strategist',       dept: 'Marketing',   email: 'ryan@corp.com',  status: 'active', avatar: 'RP', avatarColor: '#74BA58', skills: ['Copywriting', 'SEO', 'Figma'], performance: 79, projects: 8,  joined: 'Oct 2022', location: 'Denver' },
    { id: 11, name: 'Chloe Martin',   role: 'Ops Manager',              dept: 'Operations',  email: 'chloe@corp.com', status: 'active', avatar: 'CM', avatarColor: '#c0392b', skills: ['Ops', 'Jira', 'Analytics'], performance: 90, projects: 14, joined: 'Mar 2021', location: 'Toronto' },
    { id: 12, name: 'Kevin Nguyen',   role: 'Finance Analyst',          dept: 'Operations',  email: 'kevin@corp.com', status: 'away',   avatar: 'KN', avatarColor: '#1565C0', skills: ['Excel', 'Tableau', 'SQL'], performance: 84, projects: 5,  joined: 'Aug 2022', location: 'Houston' },
  ];

  readonly filteredMembers = signal<TeamMember[]>(this.members);

  constructor() {
    // Note: In a real app, use effect/computed. Simple signal for demo.
    setInterval(() => {
      this.filteredMembers.set(this.members.filter(m => {
        const q = this.search.toLowerCase();
        const matchSearch = !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
        const matchDept = !this.selectedDept || m.dept === this.selectedDept;
        return matchSearch && matchDept;
      }));
    }, 200);
  }

  readonly deptDetails = [
    { name: 'Engineering',  icon: 'code',         head: 'Priya Sharma', headcount: 5, description: 'Responsible for product development, infrastructure, and technical architecture.', goals: ['Q4 platform migration', 'Zero-downtime deployments', 'TypeScript coverage >90%'] },
    { name: 'Sales',        icon: 'point_of_sale', head: 'Sarah Kim',    headcount: 4, description: 'Drives new business acquisition, manages accounts, and ensures revenue targets are met.', goals: ['$3M ARR by Q4', '50 new enterprise accounts', 'Expand APAC market'] },
    { name: 'Marketing',    icon: 'campaign',      head: 'Nina Park',    headcount: 3, description: 'Brand, demand generation, content strategy, and product marketing.', goals: ['Launch rebrand Oct 15', '200% MQL growth', 'Launch partner portal'] },
    { name: 'Operations',   icon: 'settings',      head: 'Chloe Martin', headcount: 3, description: 'Business operations, finance, legal, and strategic initiatives.', goals: ['SOC2 Type II audit', 'ERP implementation', 'Reduce COGS by 8%'] },
  ];
}
