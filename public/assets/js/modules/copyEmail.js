export class CopyEmailManager {
    constructor() {
        this.mailLink = document.getElementById('enviar-email');
        this.buttons = document.querySelectorAll('[data-copiar]');
        this.timeouts = new WeakMap();
    }

    // O e-mail é montado aqui (e não escrito no HTML) para o Cloudflare
    // "Email Address Obfuscation" não reescrever o link e o texto.
    // Desktop: abre o Gmail no navegador (não depende de app de e-mail instalado).
    // Celular/tablet: usa mailto:, que abre o app de e-mail do aparelho.
    buildAddress() {
        if (!this.mailLink) return;
        const { user, domain, subject = '' } = this.mailLink.dataset;
        const address = `${user}@${domain}`;
        const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

        if (isDesktop) {
            this.mailLink.href = 'https://mail.google.com/mail/?' +
                `to=${encodeURIComponent(address)}` +
                `&su=${encodeURIComponent(subject)}&fs=1&tf=cm`;
            this.mailLink.target = '_blank';
            this.mailLink.rel = 'noopener noreferrer';
        } else {
            this.mailLink.href = `mailto:${address}?subject=${encodeURIComponent(subject)}`;
        }

        document.querySelectorAll('.copiavel__texto').forEach((el) => {
            el.textContent = address;
        });
    }

    async copy(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }

        // Fallback para contextos sem Clipboard API
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.setAttribute('readonly', '');
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(temp);
        if (!ok) throw new Error('Falha ao copiar');
    }

    showFeedback(button, label, message) {
        const aviso = button.closest('.copiavel')?.querySelector('.copiavel__aviso');
        const original = button.dataset.label || button.textContent;
        button.dataset.label = original;

        button.textContent = label;
        if (aviso) aviso.textContent = message;

        clearTimeout(this.timeouts.get(button));
        this.timeouts.set(button, setTimeout(() => {
            button.textContent = original;
            if (aviso) aviso.textContent = '';
        }, 2000));
    }

    init() {
        this.buildAddress();

        this.buttons.forEach((button) => {
            button.addEventListener('click', async () => {
                const source = document.getElementById(button.dataset.copiar);
                if (!source) return;

                try {
                    await this.copy(source.textContent.trim());
                    this.showFeedback(button, 'Copiado!', 'E-mail copiado!');
                } catch (error) {
                    console.error('Erro ao copiar e-mail:', error);
                    this.showFeedback(button, 'Copiar', 'Não foi possível copiar. Selecione o texto manualmente.');
                }
            });
        });
    }
}
