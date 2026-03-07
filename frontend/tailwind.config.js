/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0A0E1A",
                surface: "#111827",
                accent: {
                    blue: "#3B82F6",
                    green: "#10B981",
                    amber: "#F59E0B",
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Inter Display', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}
