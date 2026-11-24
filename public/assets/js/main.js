import { ThemeManager } from './modules/switchs.js?v=20261124-19';
import { FadeInManager } from './modules/fadeIn.js?v=20261124-19';
import { ProjectsManager } from './modules/projects.js?v=20261124-19';
import { CopyEmailManager } from './modules/copyEmail.js?v=20261124-19';

class App {
    constructor() {
        this.themeManager = new ThemeManager();
        this.fadeInManager = new FadeInManager();
        this.projectsManager = new ProjectsManager();
        this.copyEmailManager = new CopyEmailManager();
    }

    async init() {
        try {
            this.themeManager.init();
            this.fadeInManager.init();
            this.copyEmailManager.init();
            await this.projectsManager.init();
        } catch (error) {
            console.error('Erro durante inicializacao da aplicacao:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    await app.init();
});
