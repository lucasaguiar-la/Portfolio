import { FadeInManager } from './modules/fadeIn.js?v=20261026-2';

document.addEventListener('DOMContentLoaded', () => {
    new FadeInManager('.fade-in', 0.15).init();
});
