// Constantes para elementos DOM e classes
const THEME = {
    DARK: 'tema-escuro',
    LIGHT: 'tema-claro'
};

// Chave nova: ignora preferências antigas que ficaram presas no tema claro
const STORAGE_KEY = 'portfolio-theme';
const LEGACY_KEY = 'theme';

const IMAGES = {
    DARK: {
        LOGO: './assets/images/geral/portfolio-logo-dark.png',
        THEME_ICON: './assets/images/geral/escuro.png'
    },
    LIGHT: {
        LOGO: './assets/images/geral/portfolio-logo-ligth.png',
        THEME_ICON: './assets/images/geral/claro.png'
    }
};

export class ThemeManager {
    constructor() {
        this.themeButton = document.getElementById('trocarTema');
        this.logo = document.getElementById('logo');
        this.themeIcon = document.getElementById('trocar-tema-icon');
    }

    readSavedTheme() {
        try {
            localStorage.removeItem(LEGACY_KEY);
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved === THEME.LIGHT ? THEME.LIGHT : THEME.DARK;
        } catch (error) {
            return THEME.DARK;
        }
    }

    saveTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (error) {
            // localStorage indisponível: apenas não persiste a escolha
        }
    }

    applyTheme(theme) {
        const isDark = theme === THEME.DARK;
        document.body.classList.remove(THEME.DARK, THEME.LIGHT);
        document.body.classList.add(theme);
        this.updateImages(isDark);
    }

    init() {
        // Padrão: tema escuro, a menos que o visitante tenha escolhido o claro
        this.applyTheme(this.readSavedTheme());
        this.themeButton.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        const next = document.body.classList.contains(THEME.DARK) ? THEME.LIGHT : THEME.DARK;
        this.applyTheme(next);
        this.animateThemeIcon();
        this.saveTheme(next);
    }

    updateImages(isDarkTheme) {
        const theme = isDarkTheme ? IMAGES.DARK : IMAGES.LIGHT;
        this.logo.src = theme.LOGO;
        this.themeIcon.src = theme.THEME_ICON;
    }

    animateThemeIcon() {
        this.themeIcon.classList.add('girando');
        setTimeout(() => {
            this.themeIcon.classList.remove('girando');
        }, 250);
    }
}
