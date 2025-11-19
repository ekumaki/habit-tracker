/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'primary': '#10b981', // Emerald 500
                'secondary': '#3b82f6', // Blue 500
                'warning': '#f59e0b', // Amber 500
                'danger': '#ef4444', // Red 500
                'dark-bg': '#0f172a', // Slate 900
                'dark-card': '#1e293b', // Slate 800
                'dark-text': '#f8fafc', // Slate 50
                'dark-muted': '#94a3b8', // Slate 400
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
