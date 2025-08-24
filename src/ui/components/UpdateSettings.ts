export class UpdateSettings {
    private container: HTMLDivElement;
    private updateManager = window.novea.osUpdate;
    
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'update-settings';
        this.render();
    }
    
    private render() {
        this.container.innerHTML = `
            <div class="update-header">
                <h3>🔄 System Updates</h3>
                <p>Keep NoveaOS up to date with the latest features and security patches</p>
            </div>
            
            <div class="update-status">
                <div class="current-version">
                    <strong>Current Version:</strong> ${window.novea.version.pretty}
                </div>
                <div class="update-actions">
                    <button id="check-updates" class="btn btn-primary">
                        🔍 Check for Updates
                    </button>
                </div>
            </div>
            
            <div id="update-info" class="update-info" style="display: none;">
                <div class="update-details">
                    <h4>🆕 Update Available</h4>
                    <div id="update-details-content"></div>
                </div>
                <div class="update-actions">
                    <button id="download-update" class="btn btn-success">
                        ⬇️ Download Update
                    </button>
                </div>
            </div>
            
            <div id="download-progress" class="download-progress" style="display: none;">
                <div class="progress-bar">
                    <div id="progress-fill" class="progress-fill"></div>
                </div>
                <div id="progress-text">Downloading... 0%</div>
            </div>
            
            <div id="install-section" class="install-section" style="display: none;">
                <div class="install-info">
                    <h4>✅ Update Downloaded</h4>
                    <p>Ready to install. This will restart NoveaOS.</p>
                </div>
                <div class="install-actions">
                    <button id="install-update" class="btn btn-warning">
                        🚀 Install Update
                    </button>
                </div>
            </div>
            
            <div id="update-history" class="update-history">
                <h4>📋 Update History</h4>
                <div id="history-list">
                    <div class="history-item">
                        <span class="version">v${window.novea.version.major}.${window.novea.version.minor}.${window.novea.version.patch}</span>
                        <span class="date">Current</span>
                        <span class="status">✅ Installed</span>
                    </div>
                </div>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    private attachEventListeners() {
        const checkButton = this.container.querySelector('#check-updates');
        const downloadButton = this.container.querySelector('#download-update');
        const installButton = this.container.querySelector('#install-update');
        
        checkButton?.addEventListener('click', () => this.checkForUpdates());
        downloadButton?.addEventListener('click', () => this.downloadUpdate());
        installButton?.addEventListener('click', () => this.installUpdate());
    }
    
    private async checkForUpdates() {
        const checkButton = this.container.querySelector('#check-updates') as HTMLButtonElement;
        const updateInfo = this.container.querySelector('#update-info') as HTMLDivElement;
        
        try {
            checkButton.disabled = true;
            checkButton.textContent = '🔍 Checking...';
            
            const update = await this.updateManager.checkForUpdates();
            
            if (update) {
                this.showUpdateInfo(update);
                updateInfo.style.display = 'block';
            } else {
                window.novea.notifications.spawn({
                    title: 'No Updates',
                    description: 'NoveaOS is up to date!',
                    icon: '/assets/logo.svg',
                    timeout: 3000,
                });
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
            window.novea.notifications.spawn({
                title: 'Update Check Failed',
                description: 'Could not check for updates. Please try again.',
                icon: '/assets/logo.svg',
                timeout: 5000,
            });
        } finally {
            checkButton.disabled = false;
            checkButton.textContent = '🔍 Check for Updates';
        }
    }
    
    private showUpdateInfo(update: any) {
        const content = this.container.querySelector('#update-details-content');
        if (content) {
            content.innerHTML = `
                <div class="update-version">${update.version}</div>
                <div class="update-name">${update.name}</div>
                <div class="update-description">${update.description}</div>
                <div class="update-meta">
                    <span class="size">${this.formatFileSize(update.size)}</span>
                    <span class="date">${new Date(update.publishedAt).toLocaleDateString()}</span>
                </div>
            `;
        }
        
        // Store update info for download
        (this.container as any).currentUpdate = update;
    }
    
    private async downloadUpdate() {
        const update = (this.container as any).currentUpdate;
        if (!update) return;
        
        const downloadButton = this.container.querySelector('#download-update') as HTMLButtonElement;
        const progressSection = this.container.querySelector('#download-progress') as HTMLDivElement;
        const progressFill = this.container.querySelector('#progress-fill') as HTMLDivElement;
        const progressText = this.container.querySelector('#progress-text') as HTMLDivElement;
        
        try {
            downloadButton.disabled = true;
            downloadButton.textContent = '⬇️ Downloading...';
            progressSection.style.display = 'block';
            
            await this.updateManager.downloadUpdate(update, (progress: number) => {
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `Downloading... ${Math.round(progress)}%`;
            });
            
            // Show install section
            progressSection.style.display = 'none';
            this.container.querySelector('#install-section')!.style.display = 'block';
            
        } catch (error) {
            console.error('Failed to download update:', error);
            window.novea.notifications.spawn({
                title: 'Download Failed',
                description: 'Could not download update. Please try again.',
                icon: '/assets/logo.svg',
                timeout: 5000,
            });
        } finally {
            downloadButton.disabled = false;
            downloadButton.textContent = '⬇️ Download Update';
        }
    }
    
    private async installUpdate() {
        const update = (this.container as any).currentUpdate;
        if (!update) return;
        
        const installButton = this.container.querySelector('#install-update') as HTMLButtonElement;
        
        try {
            installButton.disabled = true;
            installButton.textContent = '🚀 Installing...';
            
            await this.updateManager.installUpdate(update.version);
            
            // Update history
            this.addToHistory(update.version, 'Installed');
            
        } catch (error) {
            console.error('Failed to install update:', error);
            window.novea.notifications.spawn({
                title: 'Installation Failed',
                description: 'Could not install update. Please try again.',
                icon: '/assets/logo.svg',
                timeout: 5000,
            });
        } finally {
            installButton.disabled = false;
            installButton.textContent = '🚀 Install Update';
        }
    }
    
    private addToHistory(version: string, status: string) {
        const historyList = this.container.querySelector('#history-list');
        if (historyList) {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="version">${version}</span>
                <span class="date">${new Date().toLocaleDateString()}</span>
                <span class="status">✅ ${status}</span>
            `;
            historyList.appendChild(historyItem);
        }
    }
    
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    public getElement(): HTMLDivElement {
        return this.container;
    }
}
