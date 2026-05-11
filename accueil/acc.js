// Gestion de la parallaxe
document.addEventListener("mousemove", (e) => {
    document.querySelectorAll(".parallax-layer").forEach(layer => {
        const speed = layer.getAttribute('data-speed');
        const x = (window.innerWidth - e.pageX * speed) / 100;
        const y = (window.innerHeight - e.pageY * speed) / 100;
        layer.style.transform = `translateX(${x}px) translateY(${y}px)`;
    });
});

document.addEventListener("touchmove", (e) => {
    document.querySelectorAll(".parallax-layer").forEach(layer => {
        const speed = layer.getAttribute('data-speed');
        const x = (window.innerWidth - e.touches[0].pageX * speed) / 100;
        const y = (window.innerHeight - e.touches[0].pageY * speed) / 100;
        layer.style.transform = `translateX(${x}px) translateY(${y}px)`;
    });
}, { passive: false });

// Transition vers l'Interface 2
function lancerTransition() {
    const overlay = document.getElementById('zoom-overlay');
    overlay.classList.add('zoom-active'); 

    // Petit délai pour laisser l'animation de zoom se faire
    setTimeout(() => {
        window.location.href = "interface2.html"; 
    }, 800);
}