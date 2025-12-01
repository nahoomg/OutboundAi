import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                space: ['var(--font-space)', 'system-ui', 'sans-serif'],
                soria: ['var(--font-soria)', 'serif'],
            },
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'in': 'fadeIn 0.3s ease-in',
                'slide-in-from-right': 'slideInFromRight 0.3s ease-out',
                'slide-in-from-left-2': 'slideInFromLeft 0.3s ease-out',
                'fade-in': 'fadeIn 0.3s ease-in',
                'scroll-left': 'scroll-left 40s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInFromRight: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                slideInFromLeft: {
                    '0%': { transform: 'translateX(-8px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                'scroll-left': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
