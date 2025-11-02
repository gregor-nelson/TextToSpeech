// Get the base URL for API calls (handles subdirectory deployment)
const baseUrl = window.location.pathname.replace(/\/$/, '');

class TTSApp {
    constructor() {
        this.isPlaying = false;
        this.currentAudio = null;
        this.voices = [];
        this.currentVoice = 'en-US-AvaNeural';
        this.currentSpeed = 1.0;
        this.browserPlaybackRate = 1.0;
        this.performanceData = this.loadPerformanceData();
        this.countdownInterval = null;
        this.loadingStartTime = null;
        this.loadingDelayTimeout = null;

        this.initializeElements();
        this.loadVoices();
        this.setupEventListeners();
        this.updateWordCount();
        this.updateUI();
    }

    initializeElements() {
        this.playBtn = document.getElementById('playBtn');
        this.textArea = document.getElementById('textArea');
        this.speedSelect = document.getElementById('speedSelect');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.wordCount = document.getElementById('wordCount');
        this.progressTopFill = document.getElementById('progressTopFill');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        this.infoMessage = document.getElementById('infoMessage');
        this.speedIndicator = document.getElementById('speedIndicator');
        this.speedWarning = document.getElementById('speedWarning');
    }

    async loadVoices() {
        try {
            const response = await fetch(`${baseUrl}/api/voices`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.voices = await response.json();
            this.populateVoiceSelect();
        } catch (error) {
            this.showError('Failed to load voices: ' + error.message);
        }
    }

    populateVoiceSelect() {
        this.voiceSelect.innerHTML = '';
        
        const grouped = {};
        this.voices.forEach(voice => {
            const locale = voice.Locale || 'Unknown';
            if (!grouped[locale]) grouped[locale] = [];
            grouped[locale].push(voice);
        });

        const englishLocales = Object.keys(grouped).filter(locale => 
            locale.toLowerCase().startsWith('en')).sort();
        const otherLocales = Object.keys(grouped).filter(locale => 
            !locale.toLowerCase().startsWith('en')).sort();

        [...englishLocales, ...otherLocales].forEach(locale => {
            const group = document.createElement('optgroup');
            group.label = locale;
            
            grouped[locale].forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.ShortName;
                option.textContent = voice.FriendlyName || voice.Name;
                group.appendChild(option);
            });
            
            this.voiceSelect.appendChild(group);
        });

        if (this.voices.length > 0) {
            const defaultVoice = this.voices.find(v => v.ShortName === this.currentVoice) || this.voices[0];
            this.voiceSelect.value = defaultVoice.ShortName;
            this.currentVoice = defaultVoice.ShortName;
        }
    }

    setupEventListeners() {
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.textArea.addEventListener('input', () => this.updateWordCount());
        this.voiceSelect.addEventListener('change', () => {
            this.currentVoice = this.voiceSelect.value;
        });

        this.speedSelect.addEventListener('change', () => {
            this.currentSpeed = parseFloat(this.speedSelect.value) || 1.0;
            
            if (this.currentSpeed > 2.0) {
                this.speedWarning.classList.add('show');
            } else {
                this.speedWarning.classList.remove('show');
            }
        });

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }


    updateWordCount() {
        const text = this.textArea.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        const chars = this.textArea.value.length;
        this.wordCount.textContent = `${words} words • ${chars} characters`;
    }

    async togglePlay() {
        if (this.isPlaying) {
            this.pauseResume();
        } else {
            await this.startSpeech();
        }
    }

    async startSpeech() {
        const text = this.textArea.value.trim();
        if (!text) {
            this.showError('Please enter some text to convert to speech.');
            return;
        }

        this.setPlayButtonLoading(true);
        this.setStatusBarLoading(true, text.length);
        const startTime = Date.now();
        
        try {
            const response = await fetch(`${baseUrl}/api/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    voice: this.currentVoice,
                    speed: this.currentSpeed
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Synthesis failed');
            }

            const result = await response.json();
            this.browserPlaybackRate = result.browser_playback_rate || 1.0;
            
            // Record performance for future estimates
            const actualTime = Date.now() - startTime;
            this.recordPerformance(text.length, actualTime, result.synthesis_time);
            
            if (result.browser_playback_rate > 1.0) {
                this.showInfo(`Speed ${this.currentSpeed}x: Edge-TTS + Browser acceleration`);
            } else {
                this.showSuccess('Speech generated successfully!');
            }
            
            await this.playAudio(`${baseUrl}/api/audio/${result.audio_id}`);
            
        } catch (error) {
            this.setStatusBarLoading(false);
            this.showError('Speech synthesis failed: ' + error.message);
            this.setPlayButtonLoading(false);
        }
    }

    async playAudio(url) {
        try {
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }

            this.currentAudio = new Audio(url);
            
            this.currentAudio.oncanplay = () => {
                this.currentAudio.playbackRate = this.browserPlaybackRate;
                this.isPlaying = true;
                this.setPlayButtonLoading(false);
                this.setStatusBarLoading(false);
                this.updateUI();
                this.startProgressTracking();
            };

            this.currentAudio.onended = () => {
                this.isPlaying = false;
                this.updateUI();
                this.progressTopFill.style.width = '0%';
                this.updateTimeDisplay();
            };

            this.currentAudio.onerror = () => {
                this.setStatusBarLoading(false);
                this.showError('Audio playback failed');
                this.isPlaying = false;
                this.setPlayButtonLoading(false);
                this.updateUI();
            };

            await this.currentAudio.play();

        } catch (error) {
            this.setStatusBarLoading(false);
            this.showError('Audio setup failed: ' + error.message);
            this.setPlayButtonLoading(false);
        }
    }

    startProgressTracking() {
        const updateProgress = () => {
            if (this.currentAudio && this.isPlaying) {
                const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
                this.progressTopFill.style.width = `${progress}%`;
                this.updateTimeDisplay();
                
                if (!this.currentAudio.ended) {
                    requestAnimationFrame(updateProgress);
                }
            }
        };
        updateProgress();
    }

    updateTimeDisplay() {
        if (!this.currentAudio || !this.currentAudio.duration) {
            this.timeDisplay.textContent = '--:-- / --:--';
            return;
        }

        const current = this.formatTime(this.currentAudio.currentTime || 0);
        const total = this.formatTime(this.currentAudio.duration || 0);
        this.timeDisplay.textContent = `${current} / ${total}`;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    setPlayButtonLoading(loading) {
        if (loading) {
            this.playBtn.innerHTML = '<div class="loading-spinner"></div>';
            this.playBtn.classList.add('loading');
            this.playBtn.disabled = true;
        } else {
            this.playBtn.classList.remove('loading');
            this.playBtn.disabled = false;
            this.updateUI();
        }
    }

    updateUI() {
        if (this.isPlaying) {
            this.playBtn.innerHTML = '<i class="ph ph-pause"></i>';
        } else {
            this.playBtn.innerHTML = '<i class="ph ph-play"></i>';
        }
    }

    pauseResume() {
        if (this.currentAudio) {
            if (this.currentAudio.paused) {
                this.currentAudio.play();
                this.isPlaying = true;
            } else {
                this.currentAudio.pause();
                this.isPlaying = false;
            }
            this.updateUI();
        }
    }

    showError(message) {
        this.showNotification(this.errorMessage, message, 5000);
    }

    showSuccess(message) {
        this.showNotification(this.successMessage, message, 3000);
    }

    showInfo(message) {
        this.showNotification(this.infoMessage, message, 4000);
    }

    showNotification(element, message, duration) {
        this.hideAllMessages();
        
        const textElement = element.querySelector('.notification-text');
        if (textElement) {
            textElement.textContent = message;
        } else {
            element.textContent = message;
        }
        
        element.classList.remove('hidden', 'fade-out');
        element.classList.add('show', 'auto-dismiss');
        
        setTimeout(() => {
            element.classList.add('fade-out');
            element.classList.remove('show');
            
            setTimeout(() => {
                element.classList.add('hidden');
                element.classList.remove('fade-out', 'auto-dismiss');
            }, 300);
        }, duration);
    }

    hideAllMessages() {
        [this.errorMessage, this.successMessage, this.infoMessage].forEach(element => {
            element.classList.add('hidden');
            element.classList.remove('show', 'fade-out', 'auto-dismiss');
        });
    }

    handleKeyboard(event) {
        if (document.activeElement === this.textArea && 
            !event.ctrlKey && !event.altKey && !event.metaKey) {
            return;
        }

        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            this.togglePlay();
        } else if (event.shiftKey && event.key === '>') {
            event.preventDefault();
            this.increaseSpeed();
        } else if (event.shiftKey && event.key === '<') {
            event.preventDefault();
            this.decreaseSpeed();
        }
    }

    increaseSpeed() {
        const currentIndex = this.speedSelect.selectedIndex;
        if (currentIndex < this.speedSelect.options.length - 1) {
            this.speedSelect.selectedIndex = currentIndex + 1;
            this.speedSelect.dispatchEvent(new Event('change'));
        }
    }

    decreaseSpeed() {
        const currentIndex = this.speedSelect.selectedIndex;
        if (currentIndex > 0) {
            this.speedSelect.selectedIndex = currentIndex - 1;
            this.speedSelect.dispatchEvent(new Event('change'));
        }
    }

    // Performance tracking for accurate estimates
    loadPerformanceData() {
        const saved = localStorage.getItem('tts-performance-data');
        return saved ? JSON.parse(saved) : {
            averageProcessingSpeed: 120, // conservative chars/sec
            recentSamples: [],
            networkLatency: 2000,
            voiceData: {} // voice-specific performance data
        };
    }

    recordPerformance(textLength, actualTime, serverTiming = null) {
        const sample = {
            textLength: textLength,
            actualTime: actualTime,
            serverTime: serverTiming,
            voice: this.currentVoice,
            speed: this.currentSpeed,
            timestamp: Date.now()
        };

        this.performanceData.recentSamples.push(sample);
        
        // Keep only last 15 samples
        if (this.performanceData.recentSamples.length > 15) {
            this.performanceData.recentSamples.shift();
        }

        // Update voice-specific performance
        if (serverTiming) {
            this.updateVoicePerformance(sample);
        }

        // Update overall average processing speed
        if (this.performanceData.recentSamples.length >= 3) {
            const recentSamples = this.performanceData.recentSamples.slice(-10);
            const totalChars = recentSamples.reduce((sum, s) => sum + s.textLength, 0);
            const totalTime = recentSamples.reduce((sum, s) => sum + (s.serverTime || s.actualTime), 0);
            this.performanceData.averageProcessingSpeed = (totalChars / (totalTime / 1000)) * 0.9;
        }

        // Update network latency (total time - server time)
        if (serverTiming) {
            const networkTime = actualTime - (serverTiming * 1000);
            this.performanceData.networkLatency = (this.performanceData.networkLatency + networkTime) / 2;
        }

        localStorage.setItem('tts-performance-data', JSON.stringify(this.performanceData));
    }

    updateVoicePerformance(sample) {
        if (!this.performanceData.voiceData[sample.voice]) {
            this.performanceData.voiceData[sample.voice] = {
                samples: [],
                speed: this.performanceData.averageProcessingSpeed
            };
        }

        const voiceData = this.performanceData.voiceData[sample.voice];
        voiceData.samples.push(sample);
        
        // Keep only last 5 samples per voice
        if (voiceData.samples.length > 5) {
            voiceData.samples.shift();
        }

        // Calculate voice-specific speed
        if (voiceData.samples.length >= 2) {
            const totalChars = voiceData.samples.reduce((sum, s) => sum + s.textLength, 0);
            const totalTime = voiceData.samples.reduce((sum, s) => sum + s.serverTime * 1000, 0);
            voiceData.speed = (totalChars / (totalTime / 1000)) * 0.9;
        }
    }

    calculateEstimatedTime(textLength) {
        // Use voice-specific data if available
        const voiceData = this.performanceData.voiceData?.[this.currentVoice];
        const baseSpeed = voiceData?.speed || this.performanceData.averageProcessingSpeed;
        const networkTime = this.performanceData.networkLatency / 1000;
        
        // Simple speed adjustment for synthesis rate
        let speedMultiplier = 1.0;
        if (this.currentSpeed > 1.0) {
            speedMultiplier = 1.0 + (this.currentSpeed - 1.0) * 0.3; // Higher speeds take longer
        }
        
        const processingTime = (textLength / baseSpeed) * speedMultiplier;
        const totalTime = processingTime + networkTime;

        return {
            estimate: Math.ceil(totalTime * 1.15), // 15% buffer
            min: Math.ceil(totalTime * 0.9),
            max: Math.ceil(totalTime * 1.4)
        };
    }

    setStatusBarLoading(isLoading, textLength = 0) {
        const statusBar = document.querySelector('.tts-status-bar');

        if (isLoading) {
            this.loadingStartTime = Date.now();
            const estimation = this.calculateEstimatedTime(textLength);
            
            // Only show loading state for longer operations or after minimum delay
            const shouldShowLoading = estimation.estimate > 2 || textLength > 100;
            
            if (shouldShowLoading) {
                statusBar.classList.add('loading');
                // Keep text length similar to prevent overflow
                this.wordCount.textContent = `Synthesizing text...`;
                this.timeDisplay.textContent = `Est: ${estimation.min}-${estimation.max}s`;
                document.querySelector('.status-right').innerHTML = 'Processing • <kbd>Esc</kbd> to cancel';
                this.startCountdown(estimation);
            } else {
                // For short operations, set a delay before showing loading state
                this.loadingDelayTimeout = setTimeout(() => {
                    if (statusBar && !statusBar.classList.contains('loading')) {
                        statusBar.classList.add('loading');
                        this.wordCount.textContent = `Processing text...`;
                        this.timeDisplay.textContent = 'Almost ready...';
                        document.querySelector('.status-right').innerHTML = 'Processing • <kbd>Esc</kbd> to cancel';
                    }
                }, 800); // 800ms delay before showing loading for short text
            }
        } else {
            // Clear any pending loading state
            if (this.loadingDelayTimeout) {
                clearTimeout(this.loadingDelayTimeout);
                this.loadingDelayTimeout = null;
            }
            
            // Ensure minimum loading duration to prevent flash
            const elapsed = Date.now() - (this.loadingStartTime || 0);
            const minDuration = 1200; // Minimum 1.2 seconds
            
            if (elapsed < minDuration && statusBar.classList.contains('loading')) {
                setTimeout(() => {
                    statusBar.classList.remove('loading');
                    this.stopCountdown();
                    this.resetStatusBar();
                }, minDuration - elapsed);
            } else {
                statusBar.classList.remove('loading');
                this.stopCountdown();
                this.resetStatusBar();
            }
        }
    }

    startCountdown(estimation) {
        this.countdownInterval = setInterval(() => {
            const elapsed = (Date.now() - this.loadingStartTime) / 1000;
            const remaining = Math.max(0, estimation.estimate - elapsed);

            // Keep text length consistent to prevent layout shifts
            if (remaining > 3) {
                this.timeDisplay.textContent = `~${Math.ceil(remaining)}s remaining`;
            } else if (remaining > 0) {
                this.timeDisplay.textContent = 'Almost ready...';
            } else {
                this.timeDisplay.textContent = 'Finalizing...  ';
            }
        }, 500);
    }

    stopCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    resetStatusBar() {
        this.updateWordCount();
        this.timeDisplay.textContent = '--:-- / --:--';
        document.querySelector('.status-right').innerHTML = 
            '<kbd>Ctrl+Enter</kbd> to play • <kbd>Shift+&lt;/&gt;</kbd> speed';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.ttsAppInstance = new TTSApp();
});