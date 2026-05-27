import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { TeamStateService } from '../../services/team-state.service';
import { Team } from '../../models/team';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly teamState = inject(TeamStateService);
  private readonly router = inject(Router);

  teams = signal<Team[]>([]);
  selectedTeamId = signal<string | null>(null);
  password = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  // Create team modal state
  showCreateModal = signal(false);
  newTeamName = signal('');
  newTeamPassword = signal('');
  createError = signal<string | null>(null);

  // Delete team modal state
  showDeleteModal = signal(false);
  deleteTeamId = signal<string | null>(null);
  deleteTeamName = signal('');
  deletePassword = signal('');
  deleteError = signal<string | null>(null);

  ngOnInit(): void {
    // If already authenticated, redirect
    if (this.teamState.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }
    this.teamState.restore();
    if (this.teamState.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }
    this.fetchTeams();
  }

  fetchTeams(): void {
    this.loading.set(true);
    this.teamService.list().subscribe({
      next: (teams) => {
        this.teams.set(teams);
        if (teams.length === 1) {
          this.selectedTeamId.set(teams[0].id);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les équipes');
        this.loading.set(false);
      },
    });
  }

  selectTeam(teamId: string): void {
    this.selectedTeamId.set(teamId);
    this.error.set(null);
  }

  login(): void {
    const teamId = this.selectedTeamId();
    const pwd = this.password().trim();
    if (!teamId || !pwd) return;

    this.loading.set(true);
    this.error.set(null);

    this.teamService.login(teamId, pwd).subscribe({
      next: (team) => {
        this.teamState.setTeam(team);
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: () => {
        this.error.set('Mot de passe incorrect');
        this.loading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
    this.newTeamName.set('');
    this.newTeamPassword.set('');
    this.createError.set(null);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  createTeam(): void {
    const name = this.newTeamName().trim();
    const pwd = this.newTeamPassword().trim();
    if (!name || !pwd) return;
    if (pwd.length < 4) {
      this.createError.set('Le mot de passe doit faire au moins 4 caractères');
      return;
    }

    this.loading.set(true);
    this.createError.set(null);

    this.teamService.create(name, pwd).subscribe({
      next: (team) => {
        this.teams.update((list) => [...list, team]);
        this.selectedTeamId.set(team.id);
        this.showCreateModal.set(false);
        this.loading.set(false);
      },
      error: (err) => {
        const msg =
          err?.status === 409
            ? 'Une équipe avec ce nom existe déjà'
            : "Impossible de créer l'équipe";
        this.createError.set(msg);
        this.loading.set(false);
      },
    });
  }

  openDeleteModal(team: Team, event: Event): void {
    event.stopPropagation();
    this.deleteTeamId.set(team.id);
    this.deleteTeamName.set(team.name);
    this.deletePassword.set('');
    this.deleteError.set(null);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  confirmDelete(): void {
    const teamId = this.deleteTeamId();
    const pwd = this.deletePassword().trim();
    if (!teamId || !pwd) return;

    this.loading.set(true);
    this.deleteError.set(null);

    this.teamService.delete(teamId, pwd).subscribe({
      next: () => {
        this.teams.update((list) => list.filter((t) => t.id !== teamId));
        if (this.selectedTeamId() === teamId) {
          this.selectedTeamId.set(null);
          this.password.set('');
        }
        this.showDeleteModal.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.deleteError.set('Mot de passe incorrect');
        this.loading.set(false);
      },
    });
  }
}
