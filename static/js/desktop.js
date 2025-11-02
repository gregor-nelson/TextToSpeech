/* ============================================
   TTS Server - Desktop Modal Controls
   Clean dropdowns with mobile-inspired design
   ============================================ */

class DesktopControls {
    constructor(ttsApp) {
        this.ttsApp = ttsApp;
        this.isDesktop = window.innerWidth >= 769;
        
        // Elements
        this.desktopVoiceBtn = null;
        this.desktopSpeedBtn = null;
        this.desktopVoiceModal = null;
        this.desktopSpeedModal = null;
        
        // State
        this.filteredVoices = [];
        this.filteredSpeeds = [];
        
        // Speed options with descriptions and Phosphor icons
        this.speedOptions = [
            { value: 0.25, label: 'Very Slow', description: 'Careful listening', icon: 'ph ph-pause' },
            { value: 0.5, label: 'Slow', description: 'Relaxed pace', icon: 'ph ph-timer' },
            { value: 0.75, label: 'Moderate', description: 'Comfortable pace', icon: 'ph ph-person-simple-walk' },
            { value: 1.0, label: 'Normal', description: 'Standard playback', icon: 'ph ph-play' },
            { value: 1.25, label: 'Fast', description: 'Quick learning', icon: 'ph ph-person-simple-run' },
            { value: 1.5, label: 'Faster', description: 'Rapid listening', icon: 'ph ph-fast-forward' },
            { value: 1.75, label: 'Very Fast', description: 'Advanced users', icon: 'ph ph-gauge' },
            { value: 2.0, label: 'Double Speed', description: 'Speed reading', icon: 'ph ph-lightning' },
            { value: 2.5, label: 'Accelerated', description: 'Power users', icon: 'ph ph-rocket' },
            { value: 3.0, label: 'Ultra Fast', description: 'Expert level', icon: 'ph ph-lightning-slash' },
            { value: 3.5, label: 'Ultra Plus', description: 'Maximum focus', icon: 'ph ph-fire' },
            { value: 4.0, label: 'Maximum', description: 'Extreme speed', icon: 'ph ph-flame' },
            { value: 4.5, label: 'Extreme', description: 'Professional only', icon: 'ph ph-shooting-star' },
            { value: 5.0, label: 'Ludicrous', description: 'Insane speed', icon: 'ph ph-meteor' },
            { value: 6.0, label: 'Plaid', description: 'Beyond comprehension', icon: 'ph ph-planet' }
        ];
        
        this.init();
    }
    
    init() {
        this.setupElements(); // Always setup so we can control the modals
        
        if (!this.isDesktop) {
            this.forceHideModals(); // Hide them immediately if mobile
            return;
        }
        
        // Only run desktop functionality if actually desktop
        this.setupResponsiveHandling();
        this.bindEvents();
        this.showDesktopControls();
        this.updateButtons();
    }
    
    setupElements() {
        this.desktopVoiceBtn = document.getElementById('desktopVoiceBtn');
        this.desktopSpeedBtn = document.getElementById('desktopSpeedBtn');
        this.desktopVoiceModal = document.getElementById('desktopVoiceModal');
        this.desktopSpeedModal = document.getElementById('desktopSpeedModal');
    }
    
    setupResponsiveHandling() {
        window.addEventListener('resize', () => {
            const wasDesktop = this.isDesktop;
            this.isDesktop = window.innerWidth >= 769;
            
            if (wasDesktop !== this.isDesktop) {
                if (this.isDesktop && !wasDesktop) {
                    this.initDesktopMode();
                } else if (!this.isDesktop && wasDesktop) {
                    this.exitDesktopMode();
                }
            }
        });
    }
    
    initDesktopMode() {
        // Switching from mobile to desktop
        this.showDesktopControls();
        this.updateButtons();
    }
    
    exitDesktopMode() {
        // Switching from desktop to mobile - complete cleanup like mobile.js
        this.hideDesktopControls();
        this.closeAllModals();
        // Ensure desktop modals are completely hidden and won't interfere
        if (this.desktopVoiceModal) {
            this.desktopVoiceModal.classList.add('hidden');
            this.desktopVoiceModal.style.display = 'none';
            this.desktopVoiceModal.style.pointerEvents = 'none';
        }
        if (this.desktopSpeedModal) {
            this.desktopSpeedModal.classList.add('hidden');
            this.desktopSpeedModal.style.display = 'none';
            this.desktopSpeedModal.style.pointerEvents = 'none';
        }
    }
    
    forceHideModals() {
        // Ensure desktop modals are completely hidden on non-desktop viewports
        if (this.desktopVoiceModal) {
            this.desktopVoiceModal.style.display = 'none';
            this.desktopVoiceModal.classList.add('hidden');
        }
        if (this.desktopSpeedModal) {
            this.desktopSpeedModal.style.display = 'none';
            this.desktopSpeedModal.classList.add('hidden');
        }
    }
    
    showDesktopControls() {
        if (!this.isDesktop) return; // Only show if actually desktop
        if (this.desktopVoiceBtn) this.desktopVoiceBtn.style.display = 'flex';
        if (this.desktopSpeedBtn) this.desktopSpeedBtn.style.display = 'flex';
        // Restore modal display and pointer events for desktop use
        if (this.desktopVoiceModal) {
            this.desktopVoiceModal.style.display = '';
            this.desktopVoiceModal.style.pointerEvents = '';
        }
        if (this.desktopSpeedModal) {
            this.desktopSpeedModal.style.display = '';
            this.desktopSpeedModal.style.pointerEvents = '';
        }
    }
    
    hideDesktopControls() {
        if (this.desktopVoiceBtn) this.desktopVoiceBtn.style.display = 'none';
        if (this.desktopSpeedBtn) this.desktopSpeedBtn.style.display = 'none';
        // Completely hide modals and disable pointer events
        if (this.desktopVoiceModal) {
            this.desktopVoiceModal.style.display = 'none';
            this.desktopVoiceModal.style.pointerEvents = 'none';
        }
        if (this.desktopSpeedModal) {
            this.desktopSpeedModal.style.display = 'none';
            this.desktopSpeedModal.style.pointerEvents = 'none';
        }
    }
    
    bindEvents() {
        // Voice button click
        this.desktopVoiceBtn?.addEventListener('click', () => this.openVoiceModal());
        
        // Speed button click  
        this.desktopSpeedBtn?.addEventListener('click', () => this.openSpeedModal());
        
        // Voice modal events
        if (this.desktopVoiceModal) {
            this.desktopVoiceModal.querySelector('#desktopVoiceModalClose')?.addEventListener('click', () => this.closeVoiceModal());
            this.desktopVoiceModal.querySelector('.modal-overlay')?.addEventListener('click', () => this.closeVoiceModal());
            
            const voiceSearch = this.desktopVoiceModal.querySelector('#desktopVoiceSearch');
            voiceSearch?.addEventListener('input', (e) => this.filterVoices(e.target.value));
        }
        
        // Speed modal events
        if (this.desktopSpeedModal) {
            this.desktopSpeedModal.querySelector('#desktopSpeedModalClose')?.addEventListener('click', () => this.closeSpeedModal());
            this.desktopSpeedModal.querySelector('.modal-overlay')?.addEventListener('click', () => this.closeSpeedModal());
        }
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    openVoiceModal() {
        if (!this.isDesktop) return; // Only open on desktop
        this.populateVoices();
        this.desktopVoiceModal?.classList.remove('hidden');
        
        // Focus search input
        setTimeout(() => {
            const searchInput = this.desktopVoiceModal?.querySelector('#desktopVoiceSearch');
            if (searchInput) {
                searchInput.focus();
            }
        }, 300);
    }
    
    closeVoiceModal() {
        this.desktopVoiceModal?.classList.add('hidden');
    }
    
    openSpeedModal() {
        if (!this.isDesktop) return; // Only open on desktop
        this.populateSpeeds();
        this.desktopSpeedModal?.classList.remove('hidden');
    }
    
    closeSpeedModal() {
        this.desktopSpeedModal?.classList.add('hidden');
    }
    
    closeAllModals() {
        this.closeVoiceModal();
        this.closeSpeedModal();
    }
    
    populateVoices() {
        const container = this.desktopVoiceModal?.querySelector('#desktopVoiceCategories');
        if (!container) return;
        
        const voices = this.ttsApp.voices || [];
        this.filteredVoices = [...voices];
        
        this.renderVoices(this.filteredVoices);
    }
    
    renderVoices(voices) {
        const container = this.desktopVoiceModal?.querySelector('#desktopVoiceCategories');
        if (!container) return;
        
        // Group voices by locale
        const grouped = this.groupVoicesByLocale(voices);
        
        // Sort locales: English first, then alphabetically
        const englishLocales = Object.keys(grouped).filter(locale => 
            locale.toLowerCase().startsWith('en')).sort();
        const otherLocales = Object.keys(grouped).filter(locale => 
            !locale.toLowerCase().startsWith('en')).sort();
        
        const sortedLocales = [...englishLocales, ...otherLocales];
        
        container.innerHTML = '';
        
        sortedLocales.forEach(locale => {
            const category = document.createElement('div');
            category.className = 'voice-category';
            
            const header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = this.getLocaleDisplayName(locale);
            
            const voicesHtml = grouped[locale].map(voice => {
                const isSelected = voice.ShortName === this.ttsApp.currentVoice;
                const languageData = this.getLanguageData(voice.ShortName);
                
                return `
                    <button class="option-item ${isSelected ? 'selected' : ''}" data-voice="${voice.ShortName}">
                        <span class="option-icon">${languageData.flag}</span>
                        <div class="option-details">
                            <div class="option-name">${voice.FriendlyName || voice.Name}</div>
                            <div class="option-description">${languageData.displayName}</div>
                        </div>
                    </button>
                `;
            }).join('');
            
            category.appendChild(header);
            category.innerHTML += voicesHtml;
            container.appendChild(category);
        });
        
        // Bind voice selection events
        container.querySelectorAll('.option-item').forEach(option => {
            option.addEventListener('click', () => {
                const voiceId = option.dataset.voice;
                this.selectVoice(voiceId);
            });
        });
    }
    
    populateSpeeds() {
        const container = this.desktopSpeedModal?.querySelector('#desktopSpeedOptionsList');
        if (!container) return;
        
        this.renderSpeeds(this.speedOptions);
    }
    
    renderSpeeds(speeds) {
        const container = this.desktopSpeedModal?.querySelector('#desktopSpeedOptionsList');
        if (!container) return;
        
        container.innerHTML = speeds.map(speed => {
            const isSelected = speed.value === this.ttsApp.currentSpeed;
            
            return `
                <button class="option-item ${isSelected ? 'selected' : ''}" data-speed="${speed.value}">
                    <i class="option-icon ${speed.icon}"></i>
                    <div class="option-details">
                        <div class="option-name">${speed.value}× - ${speed.label}</div>
                        <div class="option-description">${speed.description}</div>
                    </div>
                </button>
            `;
        }).join('');
        
        // Bind speed selection events
        container.querySelectorAll('.option-item').forEach(option => {
            option.addEventListener('click', () => {
                const speed = parseFloat(option.dataset.speed) || 1.0;
                this.selectSpeed(speed);
            });
        });
    }
    
    filterVoices(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            this.filteredVoices = [...this.ttsApp.voices];
        } else {
            this.filteredVoices = this.ttsApp.voices.filter(voice => {
                const name = (voice.FriendlyName || voice.Name || '').toLowerCase();
                const locale = (voice.Locale || '').toLowerCase();
                const shortName = (voice.ShortName || '').toLowerCase();
                
                return name.includes(term) || 
                       locale.includes(term) || 
                       shortName.includes(term);
            });
        }
        
        this.renderVoices(this.filteredVoices);
    }
    
    
    selectVoice(voiceId) {
        // Update TTS app
        this.ttsApp.currentVoice = voiceId;
        if (this.ttsApp.voiceSelect) {
            this.ttsApp.voiceSelect.value = voiceId;
            this.ttsApp.voiceSelect.dispatchEvent(new Event('change'));
        }
        
        // Update button
        this.updateVoiceButton();
        
        // Close modal
        this.closeVoiceModal();
    }
    
    selectSpeed(speed) {
        // Update TTS app
        this.ttsApp.currentSpeed = speed;
        if (this.ttsApp.speedSelect) {
            // Format speed to match HTML option values
            this.ttsApp.speedSelect.value = speed % 1 === 0 ? speed.toFixed(1) : speed.toString();
            this.ttsApp.speedSelect.dispatchEvent(new Event('change'));
        }
        
        // Update button
        this.updateSpeedButton();
        
        // Close modal
        this.closeSpeedModal();
    }
    
    updateButtons() {
        this.updateVoiceButton();
        this.updateSpeedButton();
    }
    
    updateVoiceButton() {
        if (!this.desktopVoiceBtn) return;
        
        const languageData = this.getLanguageData(this.ttsApp.currentVoice);
        const flagSpan = this.desktopVoiceBtn.querySelector('.button-flag');
        const textSpan = this.desktopVoiceBtn.querySelector('.button-text');
        
        if (flagSpan) flagSpan.textContent = languageData.flag;
        if (textSpan) textSpan.textContent = languageData.code;
    }
    
    updateSpeedButton() {
        if (!this.desktopSpeedBtn) return;
        
        const textSpan = this.desktopSpeedBtn.querySelector('.button-text');
        if (textSpan) {
            textSpan.textContent = `${this.ttsApp.currentSpeed}×`;
        }
    }
    
    groupVoicesByLocale(voices) {
        const grouped = {};
        voices.forEach(voice => {
            const locale = voice.Locale || 'Unknown';
            if (!grouped[locale]) grouped[locale] = [];
            grouped[locale].push(voice);
        });
        return grouped;
    }
    
    getLanguageData(voiceShortName) {
        // Extract language info from voice short name (e.g., "en-US-AvaNeural")
        const parts = (voiceShortName || '').split('-');
        const langCode = parts[0] || 'en';
        const countryCode = parts[1] || 'US';
        const fullCode = `${langCode}-${countryCode}`.toUpperCase();
        
        // Complete language mapping with hardcoded flag emojis
        const languageMap = {
            // English variants
            'EN-US': { flag: '🇺🇸', code: 'EN-US', displayName: 'English (US)' },
            'EN-GB': { flag: '🇬🇧', code: 'EN-GB', displayName: 'English (UK)' },
            'EN-AU': { flag: '🇦🇺', code: 'EN-AU', displayName: 'English (Australia)' },
            'EN-CA': { flag: '🇨🇦', code: 'EN-CA', displayName: 'English (Canada)' },
            'EN-IN': { flag: '🇮🇳', code: 'EN-IN', displayName: 'English (India)' },
            'EN-IE': { flag: '🇮🇪', code: 'EN-IE', displayName: 'English (Ireland)' },
            'EN-NZ': { flag: '🇳🇿', code: 'EN-NZ', displayName: 'English (New Zealand)' },
            'EN-ZA': { flag: '🇿🇦', code: 'EN-ZA', displayName: 'English (South Africa)' },
            'EN-SG': { flag: '🇸🇬', code: 'EN-SG', displayName: 'English (Singapore)' },
            'EN-PH': { flag: '🇵🇭', code: 'EN-PH', displayName: 'English (Philippines)' },
            'EN-HK': { flag: '🇭🇰', code: 'EN-HK', displayName: 'English (Hong Kong)' },
            'EN-NG': { flag: '🇳🇬', code: 'EN-NG', displayName: 'English (Nigeria)' },
            'EN-KE': { flag: '🇰🇪', code: 'EN-KE', displayName: 'English (Kenya)' },
            'EN-TZ': { flag: '🇹🇿', code: 'EN-TZ', displayName: 'English (Tanzania)' },
            
            // Spanish variants
            'ES-ES': { flag: '🇪🇸', code: 'ES', displayName: 'Spanish (Spain)' },
            'ES-MX': { flag: '🇲🇽', code: 'ES-MX', displayName: 'Spanish (Mexico)' },
            'ES-AR': { flag: '🇦🇷', code: 'ES-AR', displayName: 'Spanish (Argentina)' },
            'ES-CO': { flag: '🇨🇴', code: 'ES-CO', displayName: 'Spanish (Colombia)' },
            'ES-CL': { flag: '🇨🇱', code: 'ES-CL', displayName: 'Spanish (Chile)' },
            'ES-PE': { flag: '🇵🇪', code: 'ES-PE', displayName: 'Spanish (Peru)' },
            'ES-VE': { flag: '🇻🇪', code: 'ES-VE', displayName: 'Spanish (Venezuela)' },
            'ES-UY': { flag: '🇺🇾', code: 'ES-UY', displayName: 'Spanish (Uruguay)' },
            'ES-DO': { flag: '🇩🇴', code: 'ES-DO', displayName: 'Spanish (Dominican Republic)' },
            'ES-CR': { flag: '🇨🇷', code: 'ES-CR', displayName: 'Spanish (Costa Rica)' },
            'ES-GT': { flag: '🇬🇹', code: 'ES-GT', displayName: 'Spanish (Guatemala)' },
            'ES-PA': { flag: '🇵🇦', code: 'ES-PA', displayName: 'Spanish (Panama)' },
            'ES-HN': { flag: '🇭🇳', code: 'ES-HN', displayName: 'Spanish (Honduras)' },
            'ES-NI': { flag: '🇳🇮', code: 'ES-NI', displayName: 'Spanish (Nicaragua)' },
            'ES-SV': { flag: '🇸🇻', code: 'ES-SV', displayName: 'Spanish (El Salvador)' },
            'ES-CU': { flag: '🇨🇺', code: 'ES-CU', displayName: 'Spanish (Cuba)' },
            'ES-PR': { flag: '🇵🇷', code: 'ES-PR', displayName: 'Spanish (Puerto Rico)' },
            'ES-BO': { flag: '🇧🇴', code: 'ES-BO', displayName: 'Spanish (Bolivia)' },
            'ES-EC': { flag: '🇪🇨', code: 'ES-EC', displayName: 'Spanish (Ecuador)' },
            'ES-PY': { flag: '🇵🇾', code: 'ES-PY', displayName: 'Spanish (Paraguay)' },
            'ES-US': { flag: '🇺🇸', code: 'ES-US', displayName: 'Spanish (US)' },
            
            // French variants
            'FR-FR': { flag: '🇫🇷', code: 'FR', displayName: 'French (France)' },
            'FR-CA': { flag: '🇨🇦', code: 'FR-CA', displayName: 'French (Canada)' },
            'FR-BE': { flag: '🇧🇪', code: 'FR-BE', displayName: 'French (Belgium)' },
            'FR-CH': { flag: '🇨🇭', code: 'FR-CH', displayName: 'French (Switzerland)' },
            'FR-MC': { flag: '🇲🇨', code: 'FR-MC', displayName: 'French (Monaco)' },
            'FR-LU': { flag: '🇱🇺', code: 'FR-LU', displayName: 'French (Luxembourg)' },
            
            // German variants
            'DE-DE': { flag: '🇩🇪', code: 'DE', displayName: 'German (Germany)' },
            'DE-AT': { flag: '🇦🇹', code: 'DE-AT', displayName: 'German (Austria)' },
            'DE-CH': { flag: '🇨🇭', code: 'DE-CH', displayName: 'German (Switzerland)' },
            'DE-LU': { flag: '🇱🇺', code: 'DE-LU', displayName: 'German (Luxembourg)' },
            'DE-LI': { flag: '🇱🇮', code: 'DE-LI', displayName: 'German (Liechtenstein)' },
            
            // Italian variants
            'IT-IT': { flag: '🇮🇹', code: 'IT', displayName: 'Italian (Italy)' },
            'IT-CH': { flag: '🇨🇭', code: 'IT-CH', displayName: 'Italian (Switzerland)' },
            'IT-SM': { flag: '🇸🇲', code: 'IT-SM', displayName: 'Italian (San Marino)' },
            'IT-VA': { flag: '🇻🇦', code: 'IT-VA', displayName: 'Italian (Vatican)' },
            
            // Portuguese variants
            'PT-BR': { flag: '🇧🇷', code: 'PT-BR', displayName: 'Portuguese (Brazil)' },
            'PT-PT': { flag: '🇵🇹', code: 'PT', displayName: 'Portuguese (Portugal)' },
            'PT-AO': { flag: '🇦🇴', code: 'PT-AO', displayName: 'Portuguese (Angola)' },
            'PT-MZ': { flag: '🇲🇿', code: 'PT-MZ', displayName: 'Portuguese (Mozambique)' },
            
            // Russian variants
            'RU-RU': { flag: '🇷🇺', code: 'RU', displayName: 'Russian (Russia)' },
            'RU-BY': { flag: '🇧🇾', code: 'RU-BY', displayName: 'Russian (Belarus)' },
            'RU-KZ': { flag: '🇰🇿', code: 'RU-KZ', displayName: 'Russian (Kazakhstan)' },
            'RU-KG': { flag: '🇰🇬', code: 'RU-KG', displayName: 'Russian (Kyrgyzstan)' },
            
            // Chinese variants
            'ZH-CN': { flag: '🇨🇳', code: 'ZH', displayName: 'Chinese (Simplified)' },
            'ZH-TW': { flag: '🇹🇼', code: 'ZH-TW', displayName: 'Chinese (Traditional)' },
            'ZH-HK': { flag: '🇭🇰', code: 'ZH-HK', displayName: 'Chinese (Hong Kong)' },
            'ZH-SG': { flag: '🇸🇬', code: 'ZH-SG', displayName: 'Chinese (Singapore)' },
            'ZH-MO': { flag: '🇲🇴', code: 'ZH-MO', displayName: 'Chinese (Macau)' },
            
            // Arabic variants
            'AR-SA': { flag: '🇸🇦', code: 'AR', displayName: 'Arabic (Saudi Arabia)' },
            'AR-EG': { flag: '🇪🇬', code: 'AR-EG', displayName: 'Arabic (Egypt)' },
            'AR-AE': { flag: '🇦🇪', code: 'AR-AE', displayName: 'Arabic (UAE)' },
            'AR-JO': { flag: '🇯🇴', code: 'AR-JO', displayName: 'Arabic (Jordan)' },
            'AR-LB': { flag: '🇱🇧', code: 'AR-LB', displayName: 'Arabic (Lebanon)' },
            'AR-SY': { flag: '🇸🇾', code: 'AR-SY', displayName: 'Arabic (Syria)' },
            'AR-IQ': { flag: '🇮🇶', code: 'AR-IQ', displayName: 'Arabic (Iraq)' },
            'AR-MA': { flag: '🇲🇦', code: 'AR-MA', displayName: 'Arabic (Morocco)' },
            'AR-DZ': { flag: '🇩🇿', code: 'AR-DZ', displayName: 'Arabic (Algeria)' },
            'AR-TN': { flag: '🇹🇳', code: 'AR-TN', displayName: 'Arabic (Tunisia)' },
            'AR-LY': { flag: '🇱🇾', code: 'AR-LY', displayName: 'Arabic (Libya)' },
            'AR-KW': { flag: '🇰🇼', code: 'AR-KW', displayName: 'Arabic (Kuwait)' },
            'AR-QA': { flag: '🇶🇦', code: 'AR-QA', displayName: 'Arabic (Qatar)' },
            'AR-BH': { flag: '🇧🇭', code: 'AR-BH', displayName: 'Arabic (Bahrain)' },
            'AR-OM': { flag: '🇴🇲', code: 'AR-OM', displayName: 'Arabic (Oman)' },
            'AR-YE': { flag: '🇾🇪', code: 'AR-YE', displayName: 'Arabic (Yemen)' },
            
            // Asian languages
            'JA-JP': { flag: '🇯🇵', code: 'JA', displayName: 'Japanese' },
            'KO-KR': { flag: '🇰🇷', code: 'KO', displayName: 'Korean' },
            'HI-IN': { flag: '🇮🇳', code: 'HI', displayName: 'Hindi (India)' },
            'TH-TH': { flag: '🇹🇭', code: 'TH', displayName: 'Thai' },
            'VI-VN': { flag: '🇻🇳', code: 'VI', displayName: 'Vietnamese' },
            'ID-ID': { flag: '🇮🇩', code: 'ID', displayName: 'Indonesian' },
            'MS-MY': { flag: '🇲🇾', code: 'MS', displayName: 'Malay (Malaysia)' },
            'MS-BN': { flag: '🇧🇳', code: 'MS-BN', displayName: 'Malay (Brunei)' },
            'TA-IN': { flag: '🇮🇳', code: 'TA', displayName: 'Tamil (India)' },
            'TA-LK': { flag: '🇱🇰', code: 'TA-LK', displayName: 'Tamil (Sri Lanka)' },
            'TA-SG': { flag: '🇸🇬', code: 'TA-SG', displayName: 'Tamil (Singapore)' },
            'BN-IN': { flag: '🇮🇳', code: 'BN-IN', displayName: 'Bengali (India)' },
            'BN-BD': { flag: '🇧🇩', code: 'BN-BD', displayName: 'Bengali (Bangladesh)' },
            'TE-IN': { flag: '🇮🇳', code: 'TE', displayName: 'Telugu (India)' },
            'ML-IN': { flag: '🇮🇳', code: 'ML', displayName: 'Malayalam (India)' },
            'KN-IN': { flag: '🇮🇳', code: 'KN', displayName: 'Kannada (India)' },
            'GU-IN': { flag: '🇮🇳', code: 'GU', displayName: 'Gujarati (India)' },
            'PA-IN': { flag: '🇮🇳', code: 'PA', displayName: 'Punjabi (India)' },
            'MR-IN': { flag: '🇮🇳', code: 'MR', displayName: 'Marathi (India)' },
            'UR-PK': { flag: '🇵🇰', code: 'UR', displayName: 'Urdu (Pakistan)' },
            'UR-IN': { flag: '🇮🇳', code: 'UR-IN', displayName: 'Urdu (India)' },
            'NE-NP': { flag: '🇳🇵', code: 'NE', displayName: 'Nepali' },
            'SI-LK': { flag: '🇱🇰', code: 'SI', displayName: 'Sinhala' },
            'MY-MM': { flag: '🇲🇲', code: 'MY', displayName: 'Myanmar (Burmese)' },
            'KH-KH': { flag: '🇰🇭', code: 'KH', displayName: 'Khmer (Cambodian)' },
            'LO-LA': { flag: '🇱🇦', code: 'LO', displayName: 'Lao' },
            'KA-GE': { flag: '🇬🇪', code: 'KA', displayName: 'Georgian' },
            'AM-ET': { flag: '🇪🇹', code: 'AM', displayName: 'Amharic' },
            'SW-KE': { flag: '🇰🇪', code: 'SW-KE', displayName: 'Swahili (Kenya)' },
            'SW-TZ': { flag: '🇹🇿', code: 'SW-TZ', displayName: 'Swahili (Tanzania)' },
            
            // European languages
            'NL-NL': { flag: '🇳🇱', code: 'NL', displayName: 'Dutch (Netherlands)' },
            'NL-BE': { flag: '🇧🇪', code: 'NL-BE', displayName: 'Dutch (Belgium)' },
            'SV-SE': { flag: '🇸🇪', code: 'SV', displayName: 'Swedish' },
            'DA-DK': { flag: '🇩🇰', code: 'DA', displayName: 'Danish' },
            'NO-NO': { flag: '🇳🇴', code: 'NO', displayName: 'Norwegian (Bokmål)' },
            'NB-NO': { flag: '🇳🇴', code: 'NB', displayName: 'Norwegian (Bokmål)' },
            'NN-NO': { flag: '🇳🇴', code: 'NN', displayName: 'Norwegian (Nynorsk)' },
            'FI-FI': { flag: '🇫🇮', code: 'FI', displayName: 'Finnish' },
            'IS-IS': { flag: '🇮🇸', code: 'IS', displayName: 'Icelandic' },
            'PL-PL': { flag: '🇵🇱', code: 'PL', displayName: 'Polish' },
            'CS-CZ': { flag: '🇨🇿', code: 'CS', displayName: 'Czech' },
            'SK-SK': { flag: '🇸🇰', code: 'SK', displayName: 'Slovak' },
            'HU-HU': { flag: '🇭🇺', code: 'HU', displayName: 'Hungarian' },
            'RO-RO': { flag: '🇷🇴', code: 'RO', displayName: 'Romanian' },
            'BG-BG': { flag: '🇧🇬', code: 'BG', displayName: 'Bulgarian' },
            'HR-HR': { flag: '🇭🇷', code: 'HR', displayName: 'Croatian' },
            'SR-RS': { flag: '🇷🇸', code: 'SR', displayName: 'Serbian' },
            'BS-BA': { flag: '🇧🇦', code: 'BS', displayName: 'Bosnian' },
            'SL-SI': { flag: '🇸🇮', code: 'SL', displayName: 'Slovenian' },
            'MK-MK': { flag: '🇲🇰', code: 'MK', displayName: 'Macedonian' },
            'SQ-AL': { flag: '🇦🇱', code: 'SQ', displayName: 'Albanian' },
            'EL-GR': { flag: '🇬🇷', code: 'EL', displayName: 'Greek' },
            'TR-TR': { flag: '🇹🇷', code: 'TR', displayName: 'Turkish' },
            'UK-UA': { flag: '🇺🇦', code: 'UK', displayName: 'Ukrainian' },
            'BE-BY': { flag: '🇧🇾', code: 'BE', displayName: 'Belarusian' },
            'LT-LT': { flag: '🇱🇹', code: 'LT', displayName: 'Lithuanian' },
            'LV-LV': { flag: '🇱🇻', code: 'LV', displayName: 'Latvian' },
            'ET-EE': { flag: '🇪🇪', code: 'ET', displayName: 'Estonian' },
            'MT-MT': { flag: '🇲🇹', code: 'MT', displayName: 'Maltese' },
            'GA-IE': { flag: '🇮🇪', code: 'GA', displayName: 'Irish Gaelic' },
            'GD-GB': { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', code: 'GD', displayName: 'Scottish Gaelic' },
            'CY-GB': { flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', code: 'CY', displayName: 'Welsh' },
            'EU-ES': { flag: '🏴󠁥󠁳󠁰󠁶󠁿', code: 'EU', displayName: 'Basque' },
            'CA-ES': { flag: '🏴󠁥󠁳󠁣󠁴󠁿', code: 'CA', displayName: 'Catalan' },
            'GL-ES': { flag: '🏴󠁥󠁳󠁧󠁡󠁿', code: 'GL', displayName: 'Galician' },
            
            // African languages
            'AF-ZA': { flag: '🇿🇦', code: 'AF', displayName: 'Afrikaans' },
            'XH-ZA': { flag: '🇿🇦', code: 'XH', displayName: 'Xhosa' },
            'ZU-ZA': { flag: '🇿🇦', code: 'ZU', displayName: 'Zulu' },
            'HA-NG': { flag: '🇳🇬', code: 'HA', displayName: 'Hausa' },
            'YO-NG': { flag: '🇳🇬', code: 'YO', displayName: 'Yoruba' },
            'IG-NG': { flag: '🇳🇬', code: 'IG', displayName: 'Igbo' },
            
            // Other languages
            'HE-IL': { flag: '🇮🇱', code: 'HE', displayName: 'Hebrew' },
            'FA-IR': { flag: '🇮🇷', code: 'FA', displayName: 'Persian (Farsi)' },
            'AZ-AZ': { flag: '🇦🇿', code: 'AZ', displayName: 'Azerbaijani' },
            'KK-KZ': { flag: '🇰🇿', code: 'KK', displayName: 'Kazakh' },
            'UZ-UZ': { flag: '🇺🇿', code: 'UZ', displayName: 'Uzbek' },
            'KY-KG': { flag: '🇰🇬', code: 'KY', displayName: 'Kyrgyz' },
            'TG-TJ': { flag: '🇹🇯', code: 'TG', displayName: 'Tajik' },
            'TK-TM': { flag: '🇹🇲', code: 'TK', displayName: 'Turkmen' },
            'MN-MN': { flag: '🇲🇳', code: 'MN', displayName: 'Mongolian' },
            'TI-ET': { flag: '🇪🇹', code: 'TI', displayName: 'Tigrinya' },
            'SO-SO': { flag: '🇸🇴', code: 'SO', displayName: 'Somali' }
        };
        
        return languageMap[fullCode] || {
            flag: '🌐',
            code: langCode.toUpperCase(),
            displayName: `${langCode.toUpperCase()}${countryCode ? `-${countryCode}` : ''}`
        };
    }
    
    getLocaleDisplayName(locale) {
        const languageData = this.getLanguageData(locale);
        return languageData.displayName;
    }
    
    // Public method to update controls when voice/speed changes externally
    updateControls() {
        this.updateButtons();
    }
}

// Auto-initialize desktop controls when DOM is ready - following mobile.js pattern exactly
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.ttsAppInstance) {
            // Always create the instance but let it self-determine if it should activate
            window.desktopControls = new DesktopControls(window.ttsAppInstance);
            
            // Hook into voice/speed changes to update desktop controls only if desktop is active
            if (window.ttsAppInstance.voiceSelect) {
                window.ttsAppInstance.voiceSelect.addEventListener('change', () => {
                    setTimeout(() => {
                        if (window.desktopControls?.isDesktop) {
                            window.desktopControls.updateControls();
                        }
                    }, 100);
                });
            }
            
            if (window.ttsAppInstance.speedSelect) {
                window.ttsAppInstance.speedSelect.addEventListener('change', () => {
                    setTimeout(() => {
                        if (window.desktopControls?.isDesktop) {
                            window.desktopControls.updateControls();
                        }
                    }, 100);
                });
            }
        }
    }, 100);
});