/* ============================================
   TTS Server - Mobile-Specific JavaScript
   Enhanced with Dynamic Controls & Modals
   ============================================ */

class MobileControls {
    constructor(ttsApp) {
        this.ttsApp = ttsApp;
        this.voiceBtn = null;
        this.speedBtn = null;
        this.voiceModal = null;
        this.speedSheet = null;
        this.currentVoiceData = null;
        this.filteredVoices = [];
        
        this.speedOptions = [
            { value: 0.25, label: 'Slow' },
            { value: 0.5, label: 'Slower' },
            { value: 0.75, label: 'Slow' },
            { value: 1.0, label: 'Normal' },
            { value: 1.25, label: 'Fast' },
            { value: 1.5, label: 'Faster' },
            { value: 1.75, label: 'Fast' },
            { value: 2.0, label: 'Very Fast' },
            { value: 2.5, label: 'Very Fast' },
            { value: 3.0, label: 'Ultra' },
            { value: 3.5, label: 'Ultra' },
            { value: 4.0, label: 'Max' },
            { value: 4.5, label: 'Max' },
            { value: 5.0, label: 'Max' },
            { value: 6.0, label: 'Max' }
        ];
    }
    
    init() {
        this.createMobileControls();
        this.createModals();
        this.bindEvents();
        this.updateButtons();
    }
    
    createMobileControls() {
        // Create or find the mobile controls row in the header
        let mobileControlsRow = document.querySelector('.mobile-controls-row');
        if (!mobileControlsRow) {
            const header = document.querySelector('.tts-header');
            if (!header) return;
            
            mobileControlsRow = document.createElement('div');
            mobileControlsRow.className = 'mobile-controls-row';
            header.appendChild(mobileControlsRow);
        }
        
        // Create voice button
        this.voiceBtn = document.createElement('button');
        this.voiceBtn.className = 'control-button-dynamic voice-button';
        this.voiceBtn.id = 'mobileVoiceBtn';
        this.voiceBtn.innerHTML = `
            <span class="button-icon">🇺🇸</span>
            <span class="button-text">EN-US</span>
            <i class="ph ph-caret-down button-chevron"></i>
        `;
        
        // Get the original play button and clone it for mobile controls row
        const originalPlayBtn = document.querySelector('#playBtn');
        const playBtn = originalPlayBtn ? originalPlayBtn.cloneNode(true) : null;
        if (playBtn) {
            playBtn.id = 'mobilePlayBtn';
        }
        
        // Create speed button
        this.speedBtn = document.createElement('button');
        this.speedBtn.className = 'control-button-dynamic speed-button';
        this.speedBtn.id = 'mobileSpeedBtn';
        this.speedBtn.innerHTML = `
            <i class="ph ph-speedometer button-icon"></i>
            <span class="button-text">1.0×</span>
            <i class="ph ph-caret-down button-chevron"></i>
        `;
        
        // Add controls to the mobile controls row in correct order
        mobileControlsRow.appendChild(this.voiceBtn);
        if (playBtn) {
            mobileControlsRow.appendChild(playBtn);
            // Sync the cloned play button with the original
            this.syncPlayButtonEvents(originalPlayBtn, playBtn);
        }
        mobileControlsRow.appendChild(this.speedBtn);
    }
    
    syncPlayButtonEvents(originalBtn, clonedBtn) {
        if (!originalBtn || !clonedBtn) return;
        
        // Sync click events
        clonedBtn.addEventListener('click', () => {
            originalBtn.click();
        });
        
        // Sync visual state
        const syncState = () => {
            clonedBtn.innerHTML = originalBtn.innerHTML;
            clonedBtn.className = originalBtn.className;
            clonedBtn.classList.add('play-button-primary'); // Ensure mobile styling
        };
        
        // Initial sync
        syncState();
        
        // Watch for changes in the original button
        const observer = new MutationObserver(syncState);
        observer.observe(originalBtn, { 
            childList: true, 
            attributes: true, 
            attributeFilter: ['class'] 
        });
        
        return observer;
    }
    
    createModals() {
        // Create voice modal
        this.voiceModal = document.createElement('div');
        this.voiceModal.className = 'mobile-modal voice-modal hidden';
        this.voiceModal.id = 'voiceModal';
        this.voiceModal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content voice-modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Select Voice</h3>
                    <button class="modal-close" id="voiceModalClose">
                        <i class="ph ph-x"></i>
                    </button>
                </div>
                
                <div class="modal-search">
                    <i class="ph ph-magnifying-glass search-icon"></i>
                    <input type="text" class="search-input" placeholder="Search voices..." id="voiceSearch">
                </div>
                
                <div class="voice-categories" id="voiceCategories">
                    <!-- Dynamic voice list -->
                </div>
            </div>
        `;
        
        // Create speed sheet
        this.speedSheet = document.createElement('div');
        this.speedSheet.className = 'mobile-sheet speed-sheet hidden';
        this.speedSheet.id = 'speedSheet';
        this.speedSheet.innerHTML = `
            <div class="sheet-overlay"></div>
            <div class="sheet-content">
                <div class="sheet-handle"></div>
                <div class="sheet-header">
                    <h3 class="sheet-title">Playback Speed</h3>
                </div>
                <div class="speed-options-grid" id="speedOptionsGrid">
                    <!-- Dynamic speed options -->
                </div>
            </div>
        `;
        
        document.body.appendChild(this.voiceModal);
        document.body.appendChild(this.speedSheet);
        
        this.populateSpeedOptions();
    }
    
    bindEvents() {
        // Voice button click
        this.voiceBtn?.addEventListener('click', () => this.openVoiceModal());
        
        // Speed button click
        this.speedBtn?.addEventListener('click', () => this.openSpeedSheet());
        
        // Modal close events
        this.voiceModal.querySelector('#voiceModalClose')?.addEventListener('click', () => this.closeVoiceModal());
        this.voiceModal.querySelector('.modal-overlay')?.addEventListener('click', () => this.closeVoiceModal());
        
        this.speedSheet.querySelector('.sheet-overlay')?.addEventListener('click', () => this.closeSpeedSheet());
        
        // Voice search
        const voiceSearch = this.voiceModal.querySelector('#voiceSearch');
        voiceSearch?.addEventListener('input', (e) => this.filterVoices(e.target.value));
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeVoiceModal();
                this.closeSpeedSheet();
            }
        });
        
        // Touch feedback
        this.setupTouchFeedback();
    }
    
    setupTouchFeedback() {
        [this.voiceBtn, this.speedBtn].forEach(button => {
            if (!button) return;
            
            button.addEventListener('touchstart', () => {
                button.classList.add('touch-active');
            }, { passive: true });
            
            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.classList.remove('touch-active');
                }, 150);
            });
            
            button.addEventListener('touchcancel', () => {
                button.classList.remove('touch-active');
            });
        });
    }
    
    openVoiceModal() {
        this.populateVoices();
        this.voiceModal.classList.remove('hidden');
        
        // Focus search input
        setTimeout(() => {
            const searchInput = this.voiceModal.querySelector('#voiceSearch');
            if (searchInput) {
                searchInput.focus();
            }
        }, 300);
    }
    
    closeVoiceModal() {
        this.voiceModal.classList.add('hidden');
    }
    
    openSpeedSheet() {
        this.updateSpeedSelection();
        this.speedSheet.classList.remove('hidden');
    }
    
    closeSpeedSheet() {
        this.speedSheet.classList.add('hidden');
    }
    
    populateVoices() {
        const container = this.voiceModal.querySelector('#voiceCategories');
        if (!container) return;
        
        const voices = this.ttsApp.voices || [];
        this.filteredVoices = [...voices];
        
        this.renderVoices(this.filteredVoices);
    }
    
    renderVoices(voices) {
        const container = this.voiceModal.querySelector('#voiceCategories');
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
                    <button class="voice-option ${isSelected ? 'selected' : ''}" data-voice="${voice.ShortName}">
                        <span class="voice-flag">${languageData.flag}</span>
                        <div class="voice-details">
                            <div class="voice-name">${voice.FriendlyName || voice.Name}</div>
                            <div class="voice-locale">${languageData.displayName}</div>
                        </div>
                    </button>
                `;
            }).join('');
            
            category.appendChild(header);
            category.innerHTML += voicesHtml;
            container.appendChild(category);
        });
        
        // Bind voice selection events
        container.querySelectorAll('.voice-option').forEach(option => {
            option.addEventListener('click', () => {
                const voiceId = option.dataset.voice;
                this.selectVoice(voiceId);
            });
        });
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
        }
        
        // Update button
        this.updateVoiceButton();
        
        // Close modal
        this.closeVoiceModal();
    }
    
    populateSpeedOptions() {
        const container = this.speedSheet.querySelector('#speedOptionsGrid');
        if (!container) return;
        
        container.innerHTML = this.speedOptions.map(option => `
            <button class="speed-option" data-speed="${option.value}">
                <div class="speed-value">${option.value}×</div>
                <div class="speed-label">${option.label}</div>
            </button>
        `).join('');
        
        // Bind speed selection events
        container.querySelectorAll('.speed-option').forEach(option => {
            option.addEventListener('click', () => {
                const speed = parseFloat(option.dataset.speed) || 1.0;
                this.selectSpeed(speed);
            });
        });
    }
    
    updateSpeedSelection() {
        const container = this.speedSheet.querySelector('#speedOptionsGrid');
        if (!container) return;
        
        container.querySelectorAll('.speed-option').forEach(option => {
            const speed = parseFloat(option.dataset.speed) || 1.0;
            const isSelected = speed === this.ttsApp.currentSpeed;
            option.classList.toggle('selected', isSelected);
        });
    }
    
    selectSpeed(speed) {
        // Update TTS app
        this.ttsApp.currentSpeed = speed;
        if (this.ttsApp.speedSelect) {
            // Format speed to match HTML option values (e.g., "2.0" not "2")
            this.ttsApp.speedSelect.value = speed % 1 === 0 ? speed.toFixed(1) : speed.toString();
            this.ttsApp.speedSelect.dispatchEvent(new Event('change'));
        }
        
        // Update button
        this.updateSpeedButton();
        
        // Close sheet
        this.closeSpeedSheet();
    }
    
    updateButtons() {
        this.updateVoiceButton();
        this.updateSpeedButton();
    }
    
    updateVoiceButton() {
        if (!this.voiceBtn) return;
        
        const languageData = this.getLanguageData(this.ttsApp.currentVoice);
        const iconSpan = this.voiceBtn.querySelector('.button-icon');
        const textSpan = this.voiceBtn.querySelector('.button-text');
        
        if (iconSpan) iconSpan.textContent = languageData.flag;
        if (textSpan) textSpan.textContent = languageData.code;
    }
    
    updateSpeedButton() {
        if (!this.speedBtn) return;
        
        const textSpan = this.speedBtn.querySelector('.button-text');
        if (textSpan) {
            textSpan.textContent = `${this.ttsApp.currentSpeed}×`;
        }
    }
    
    getLanguageData(voiceShortName) {
        // Extract language info from voice short name (e.g., "en-US-AvaNeural")
        const parts = (voiceShortName || '').split('-');
        const langCode = parts[0] || 'en';
        const countryCode = parts[1] || 'US';
        const fullCode = `${langCode}-${countryCode}`.toUpperCase();
        
        // Language mapping with flags and display names
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
            'SO-SO': { flag: '🇸🇴', code: 'SO', displayName: 'Somali' },
            
            // American indigenous and minority languages
            'CY-AR': { flag: '🇦🇷', code: 'CY-AR', displayName: 'Welsh (Argentina)' },
            'QU-PE': { flag: '🇵🇪', code: 'QU', displayName: 'Quechua' },
            'GN-PY': { flag: '🇵🇾', code: 'GN', displayName: 'Guarani' }
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
    
    // Integration with existing mobile feedback
    showMobileSpeedFeedback() {
        const feedback = document.createElement('div');
        feedback.className = 'mobile-speed-feedback';
        feedback.textContent = `Speed: ${this.ttsApp.currentSpeed}×`;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.classList.add('fade-out');
            setTimeout(() => {
                feedback.remove();
            }, 300);
        }, 1000);
    }
}

class MobileUI {
    constructor(ttsApp) {
        this.ttsApp = ttsApp;
        this.isMobile = window.innerWidth <= 480;
        this.isVirtualKeyboardOpen = false;
        this.mobileControls = null;
        
        this.init();
    }
    
    init() {
        if (!this.isMobile) return;
        
        this.setupMobileDetection();
        this.setupVirtualKeyboardHandling();
        this.setupTouchInteractions();
        this.setupMobileSpecificUI();
        this.overrideMobileSpeedIndicator();
        this.initializeMobileControls();
    }
    
    initializeMobileControls() {
        // Wait for voices to be loaded
        const initControls = () => {
            if (this.ttsApp.voices && this.ttsApp.voices.length > 0) {
                this.mobileControls = new MobileControls(this.ttsApp);
                this.mobileControls.init();
            } else {
                setTimeout(initControls, 100);
            }
        };
        initControls();
    }
    
    setupMobileDetection() {
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 480;
            
            if (wasMobile !== this.isMobile) {
                if (this.isMobile && !wasMobile) {
                    this.initMobileMode();
                } else if (!this.isMobile && wasMobile) {
                    this.exitMobileMode();
                }
            }
        });
    }
    
    initMobileMode() {
        this.setupMobileSpecificUI();
        this.overrideMobileSpeedIndicator();
        this.initializeMobileControls();
    }
    
    exitMobileMode() {
        this.restoreDesktopUI();
    }
    
    setupVirtualKeyboardHandling() {
        const textArea = this.ttsApp.textArea;
        if (!textArea) return;
        
        let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        
        const handleViewportChange = () => {
            if (!window.visualViewport) return;
            
            const currentHeight = window.visualViewport.height;
            const heightDifference = initialViewportHeight - currentHeight;
            
            const wasKeyboardOpen = this.isVirtualKeyboardOpen;
            this.isVirtualKeyboardOpen = heightDifference > 150;
            
            if (this.isVirtualKeyboardOpen !== wasKeyboardOpen) {
                this.handleVirtualKeyboardToggle(this.isVirtualKeyboardOpen);
            }
        };
        
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
        } else {
            window.addEventListener('resize', handleViewportChange);
        }
        
        textArea.addEventListener('focus', () => {
            setTimeout(() => {
                if (this.isMobile) {
                    textArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        });
    }
    
    handleVirtualKeyboardToggle(isOpen) {
        const app = document.querySelector('.tts-app');
        const statusBar = document.querySelector('.tts-status-bar');
        
        if (isOpen) {
            app?.classList.add('keyboard-open');
            statusBar?.classList.add('keyboard-hidden');
        } else {
            app?.classList.remove('keyboard-open');
            statusBar?.classList.remove('keyboard-hidden');
        }
    }
    
    setupTouchInteractions() {
        this.setupTouchFeedback();
        this.setupSwipeGestures();
    }
    
    setupTouchFeedback() {
        const buttons = document.querySelectorAll('.play-button-primary, .control-button-dynamic, .settings-button');
        
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.classList.add('touch-active');
            }, { passive: true });
            
            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.classList.remove('touch-active');
                }, 150);
            });
            
            button.addEventListener('touchcancel', () => {
                button.classList.remove('touch-active');
            });
        });
    }
    
    setupSwipeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (!e.changedTouches.length) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (e.target.closest('.text-input')) return;
                
                if (deltaX > 0) {
                    this.handleSwipeSpeedChange(-1);
                } else {
                    this.handleSwipeSpeedChange(1);
                }
            }
        });
    }
    
    handleSwipeSpeedChange(direction) {
        if (direction > 0) {
            this.ttsApp.increaseSpeed();
        } else {
            this.ttsApp.decreaseSpeed();
        }
        
        this.showMobileSpeedFeedback();
        
        // Update mobile controls if available
        if (this.mobileControls) {
            this.mobileControls.updateSpeedButton();
        }
    }
    
    showMobileSpeedFeedback() {
        if (this.mobileControls) {
            this.mobileControls.showMobileSpeedFeedback();
        }
    }
    
    setupMobileSpecificUI() {
        if (!this.isMobile) return;
        
        this.customizeMobileStatusBar();
        this.adjustNotificationContainer();
    }
    
    customizeMobileStatusBar() {
        const originalSetStatusBarLoading = this.ttsApp.setStatusBarLoading.bind(this.ttsApp);
        
        this.ttsApp.setStatusBarLoading = (isLoading, textLength = 0) => {
            originalSetStatusBarLoading(isLoading, textLength);
            
            if (isLoading && this.isMobile) {
                const controlZone = document.querySelector('.control-zone-center');
                if (controlZone) {
                    controlZone.style.opacity = '1';
                    controlZone.style.pointerEvents = 'auto';
                }
            }
        };
    }
    
    adjustNotificationContainer() {
        const container = document.querySelector('.notification-container');
        if (container && this.isMobile) {
            container.style.zIndex = '1051';
            container.style.bottom = '80px';
            container.style.top = 'auto';
        }
    }
    
    overrideMobileSpeedIndicator() {
        if (!this.isMobile) return;
        
        // Check if the method exists before trying to bind it
        const originalUpdateSpeedIndicator = this.ttsApp.updateSpeedIndicator 
            ? this.ttsApp.updateSpeedIndicator.bind(this.ttsApp) 
            : null;
        
        this.ttsApp.updateSpeedIndicator = () => {
            // Call original method if it existed
            if (originalUpdateSpeedIndicator) {
                originalUpdateSpeedIndicator();
            }
            
            if (this.ttsApp.currentSpeed > 2.0) {
                this.showMobileSpeedWarning();
            } else {
                this.hideMobileSpeedWarning();
            }
            
            // Update mobile controls if available
            if (this.mobileControls) {
                this.mobileControls.updateSpeedButton();
            }
        };
    }
    
    showMobileSpeedWarning() {
        const statusLeft = document.querySelector('.status-left');
        if (statusLeft && this.isMobile) {
            statusLeft.classList.add('speed-warning-active');
            if (!statusLeft.dataset.originalText) {
                statusLeft.dataset.originalText = statusLeft.textContent;
            }
            statusLeft.textContent = `High speed mode: ${this.ttsApp.currentSpeed}x`;
        }
    }
    
    hideMobileSpeedWarning() {
        const statusLeft = document.querySelector('.status-left');
        if (statusLeft && statusLeft.dataset.originalText) {
            statusLeft.classList.remove('speed-warning-active');
            statusLeft.textContent = statusLeft.dataset.originalText;
            delete statusLeft.dataset.originalText;
        }
    }
    
    restoreDesktopUI() {
        const statusLeft = document.querySelector('.status-left');
        if (statusLeft?.dataset.originalText) {
            statusLeft.classList.remove('speed-warning-active');
            statusLeft.textContent = statusLeft.dataset.originalText;
            delete statusLeft.dataset.originalText;
        }
        
        const container = document.querySelector('.notification-container');
        if (container) {
            container.style.zIndex = '';
            container.style.bottom = '';
            container.style.top = '';
        }
    }
    
    // Public method to update controls when voice/speed changes externally
    updateControls() {
        if (this.mobileControls) {
            this.mobileControls.updateButtons();
        }
    }
}

// Auto-initialize mobile UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.ttsAppInstance) {
            window.mobileUI = new MobileUI(window.ttsAppInstance);
            
            // Hook into voice/speed changes to update mobile controls
            const originalVoiceChange = window.ttsAppInstance.voiceSelect?.addEventListener;
            if (window.ttsAppInstance.voiceSelect) {
                window.ttsAppInstance.voiceSelect.addEventListener('change', () => {
                    setTimeout(() => window.mobileUI?.updateControls(), 100);
                });
            }
            
            const originalSpeedChange = window.ttsAppInstance.speedSelect?.addEventListener;
            if (window.ttsAppInstance.speedSelect) {
                window.ttsAppInstance.speedSelect.addEventListener('change', () => {
                    setTimeout(() => window.mobileUI?.updateControls(), 100);
                });
            }
        }
    }, 100);
});

// CSS injection for additional mobile styles
const mobileCSS = `
/* Additional mobile interaction states */
.control-button-dynamic.touch-active {
    transform: scale(0.95);
    background: var(--gray-200);
}

.mobile-modal .modal-content {
    animation: modalSlideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.mobile-sheet .sheet-content {
    animation: sheetSlideUp 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(30px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@keyframes sheetSlideUp {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

/* Scrollbar styling for voice modal */
.voice-categories::-webkit-scrollbar {
    width: 4px;
}

.voice-categories::-webkit-scrollbar-track {
    background: transparent;
}

.voice-categories::-webkit-scrollbar-thumb {
    background: var(--gray-300);
    border-radius: 2px;
}

.voice-categories::-webkit-scrollbar-thumb:hover {
    background: var(--gray-400);
}

/* Focus styles for accessibility */
.voice-option:focus,
.speed-option:focus,
.control-button-dynamic:focus {
    outline: 2px solid var(--accent-blue);
    outline-offset: 2px;
}

.modal-close:focus {
    outline: 2px solid var(--accent-blue);
    outline-offset: 1px;
}
`;

const mobileStyleElement = document.createElement('style');
mobileStyleElement.textContent = mobileCSS;
document.head.appendChild(mobileStyleElement);
