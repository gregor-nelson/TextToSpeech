/**
 * ThemeManager - Handles light/dark theme switching
 * Based on reference implementation from tts-notes
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'dark'; // Default theme
        this.themeKey = 'tts-theme'; // LocalStorage key
    }

    /**
     * Initialize theme system
     * - Load saved theme or use default
     * - Prevent FOUC (Flash of Unstyled Content)
     * - Bind toggle button
     */
    init() {
        // Prevent transitions on initial page load
        document.body.classList.add('no-transition');

        // Load saved theme or use dark as default
        const savedTheme = localStorage.getItem(this.themeKey);
        this.currentTheme = savedTheme || 'dark';

        // Apply the theme
        this.applyTheme(this.currentTheme);

        // Remove no-transition class after a short delay
        setTimeout(() => {
            document.body.classList.remove('no-transition');
        }, 50);

        // Bind toggle button if it exists
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
            this.updateToggleIcon();
        }
    }

    /**
     * Toggle between dark and light themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Set theme and save to localStorage
     */
    setTheme(theme) {
        this.applyTheme(theme);
        localStorage.setItem(this.themeKey, theme);
        console.log(`Theme changed to: ${theme}`);
    }

    /**
     * Apply theme by adding/removing body class
     */
    applyTheme(theme) {
        const body = document.body;

        if (theme === 'light') {
            body.classList.add('light-mode');
        } else {
            body.classList.remove('light-mode');
        }

        this.currentTheme = theme;
        this.updateToggleIcon();
    }

    /**
     * Update toggle button icon based on current theme
     * Dark mode shows sun (click to go light)
     * Light mode shows moon (click to go dark)
     */
    updateToggleIcon() {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (!toggleBtn) return;

        const icon = toggleBtn.querySelector('i');
        if (!icon) return;

        // Update icon based on current theme
        if (this.currentTheme === 'dark') {
            icon.className = 'ph ph-sun'; // Sun icon = switch to light
        } else {
            icon.className = 'ph ph-moon'; // Moon icon = switch to dark
        }
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Create global instance
window.themeManager = new ThemeManager();
