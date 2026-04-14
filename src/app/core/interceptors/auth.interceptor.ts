import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    console.log('🚀 Interceptor ejecutándose para:', req.url);
    const token = localStorage.getItem('session_token');

    console.log('🔑 Token encontrado:', token ? 'SÍ' : 'NO');

    if (token) {
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(cloned);
    }

    return next(req);
};