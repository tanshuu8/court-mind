/**
 * LandingPage.tsx — thin re-export shim.
 *
 * The routing in App.tsx imports this file by name.
 * All real content lives in Landing.tsx (componentised, per spec).
 * This keeps App.tsx untouched while satisfying the engineering rules.
 */
export { default } from './Landing';
