/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: "#0a0a0a",
                primary: "#ffd700", // Gold
                secondary: "#00f2ff", // Cyan
                accent: "#bc13fe", // Purple
                dim: "#a0a0a0",
                dark: "#0a0a0c",
            },
            fontFamily: {
                display: ['Outfit', 'sans-serif'],
                body: ['Manrope', 'sans-serif'],
            },
            animation: {
                'marquee': 'marquee 30s linear infinite',
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-100%)' },
                }
            }
        },
    },
    plugins: [],
}
