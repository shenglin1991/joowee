import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TeamStateService } from '../services/team-state.service';

export const teamGuard: CanActivateFn = () => {
  const teamState = inject(TeamStateService);
  const router = inject(Router);

  // Try restoring from session if not already set
  if (!teamState.isAuthenticated()) {
    teamState.restore();
  }

  if (teamState.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
