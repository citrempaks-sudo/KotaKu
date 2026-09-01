tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                cheerful: {
                    white: '#FFFFFF',
                    bgLight: '#F0F4F9', 
                    blue: {
                        50: '#EFF6FF', 100: '#DBEAFE', 500: '#3B82F6',
                        600: '#2563EB', 800: '#1E40AF', 900: '#1E3A8A'
                    },
                    yellow: { 100: '#FEF3C7', 400: '#FBBF24', 500: '#F59E0B' },
                    green: { 100: '#D1FAE5', 500: '#10B981', 600: '#059669' },
                    red: { 100: '#FCE7F3', 500: '#EF4444' }
                },
                darkBg: '#0F172A',  
                darkCard: '#1E293B'  
            },
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            }
        }
    }
}

window.addEventListener("load", function () {
    const loader = document.getElementById("loading-screen");
    if (!loader) return;

    loader.style.opacity = "0";

    setTimeout(() => {
        loader.style.display = "none";
    }, 500);
});