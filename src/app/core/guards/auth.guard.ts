import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';
import { Permission } from '../models/user.model';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.initialized$.pipe(
        filter(init => init === true),
        take(1),
        map(() => {
            const user = authService.getCurrentUser();

            if (!user) {
                return router.createUrlTree(['/login']);
            }

            const requiredPermission = route.data['permission'] as Permission;

            if (requiredPermission && !authService.hasPermission(requiredPermission)) {
                return router.createUrlTree(['/app/home']);
            }

            return true;
        })
    );
};