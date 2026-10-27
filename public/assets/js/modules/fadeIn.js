export class FadeInManager {
    constructor(selector = ".fade-in", threshold = 0.5) {
        this.fadeIns = document.querySelectorAll(selector);
        this.threshold = threshold;
    }

    init() {
        const observador = new IntersectionObserver((entrada, observador) => {
            entrada.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add("start");
                    observador.unobserve(entrada.target);
                }
            });
        }, {
            threshold: this.threshold
        });

        this.fadeIns.forEach(fadeIn => {
            observador.observe(fadeIn);
        });
    }
}