import { ThemeManager } from './modules/switchs.js?v=20261123-6';
import { FadeInManager } from './modules/fadeIn.js?v=20260421-3';
import { CardManager } from './modules/addCards.js?v=20260421-3';
import { CopyEmailManager } from './modules/copyEmail.js?v=20261123-6';

class App {
    constructor() {
        this.themeManager = new ThemeManager();
        this.fadeInManager = new FadeInManager();
        this.cardManager = new CardManager();
        this.copyEmailManager = new CopyEmailManager();
    }

    async init() {
        try {
            this.themeManager.init();
            this.fadeInManager.init();
            this.copyEmailManager.init();
            await this.cardManager.init();
        } catch (error) {
            console.error('Erro durante inicializacao da aplicacao:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    await app.init();
});
