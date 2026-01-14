import { environment } from '../../environments/environment';

// Détection automatique de l'URL de l'API basée sur l'origine actuelle
function getApiBaseUrl(): string {
  if (!environment.production) {
    // En développement, utiliser l'URL définie dans environment.ts
    return environment.apiUrl;
  }
  
  // En production, utiliser l'origine actuelle (IP ou domaine)
  // Cela fonctionne automatiquement pour https://adrien-sheng-lin.fr et https://37.187.218.143
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  
  // Fallback si window n'est pas disponible (SSR)
  return environment.apiUrl;
}

export const API_BASE_URL = getApiBaseUrl();
