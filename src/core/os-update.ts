interface GitHubRelease {
    tag_name: string;
    name: string;
    body: string;
    published_at: string;
    assets: {
        name: string;
        browser_download_url: string;
        size: number;
    }[];
}

interface UpdateInfo {
    version: string;
    name: string;
    description: string;
    publishedAt: string;
    downloadUrl: string;
    size: number;
    isNewer: boolean;
}

export class OSUpdateManager {
    private readonly GITHUB_API = 'https://api.github.com/repos/PsychyBruh/NoveaOS/releases/latest';
    private readonly P2P_UPDATE_SERVER = 'https://your-p2p-server.com/updates'; // You'll set this
    
    /**
     * Check for available OS updates
     */
    async checkForUpdates(): Promise<UpdateInfo | null> {
        try {
            // Get latest release from GitHub
            const response = await fetch(this.GITHUB_API);
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const release: GitHubRelease = await response.json();
            
            // Parse version from tag (e.g., "v1.4.0" -> [1, 4, 0])
            const versionParts = release.tag_name.replace('v', '').split('.').map(Number);
            const currentVersion = window.novea.version;
            
            // Check if this is a newer version
            const isNewer = this.compareVersions(
                [currentVersion.major, currentVersion.minor, currentVersion.patch],
                versionParts
            );
            
            if (!isNewer) {
                return null; // No update available
            }
            
            // Find the main update asset (you can customize this logic)
            const updateAsset = release.assets.find(asset => 
                asset.name.includes('noveaos') || 
                asset.name.includes('update') ||
                asset.name.endsWith('.zip')
            );
            
            if (!updateAsset) {
                throw new Error('No suitable update asset found');
            }
            
            return {
                version: release.tag_name,
                name: release.name,
                description: release.body,
                publishedAt: release.published_at,
                downloadUrl: updateAsset.browser_download_url,
                size: updateAsset.size,
                isNewer: true
            };
            
        } catch (error) {
            console.error('Failed to check for updates:', error);
            throw error;
        }
    }
    
    /**
     * Download and install an update
     */
    async downloadUpdate(updateInfo: UpdateInfo, onProgress?: (progress: number) => void): Promise<void> {
        try {
            // Download through your P2P server for better performance
            const p2pUrl = `${this.P2P_UPDATE_SERVER}/${updateInfo.version}`;
            
            // Start download with progress tracking
            const response = await this.downloadWithProgress(p2pUrl, onProgress);
            
            // Verify download integrity (you can add checksum verification)
            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }
            
            // Store update for installation
            const updateBlob = await response.blob();
            await this.storeUpdate(updateInfo.version, updateBlob);
            
            // Notify user that download is complete
            window.novea.notifications.spawn({
                title: 'Update Downloaded',
                description: `${updateInfo.name} is ready to install`,
                icon: '/assets/logo.svg',
                timeout: 5000,
            });
            
        } catch (error) {
            console.error('Failed to download update:', error);
            throw error;
        }
    }
    
    /**
     * Install the downloaded update
     */
    async installUpdate(version: string): Promise<void> {
        try {
            // Get the stored update
            const updateBlob = await this.getStoredUpdate(version);
            if (!updateBlob) {
                throw new Error('Update not found. Please download it first.');
            }
            
            // Extract and install the update
            await this.extractAndInstall(updateBlob);
            
            // Update system version
            await this.updateSystemVersion(version);
            
            // Notify user to restart
            window.novea.notifications.spawn({
                title: 'Update Installed',
                description: 'Please restart NoveaOS to apply changes',
                icon: '/assets/logo.svg',
                timeout: 0, // No timeout - user needs to see this
            });
            
        } catch (error) {
            console.error('Failed to install update:', error);
            throw error;
        }
    }
    
    /**
     * Compare version numbers
     */
    private compareVersions(current: number[], latest: number[]): boolean {
        for (let i = 0; i < Math.max(current.length, latest.length); i++) {
            const currentPart = current[i] || 0;
            const latestPart = latest[i] || 0;
            
            if (latestPart > currentPart) return true;
            if (latestPart < currentPart) return false;
        }
        return false; // Versions are equal
    }
    
    /**
     * Download with progress tracking
     */
    private async downloadWithProgress(url: string, onProgress?: (progress: number) => void): Promise<Response> {
        const response = await fetch(url);
        
        if (!response.body) {
            throw new Error('No response body');
        }
        
        const reader = response.body.getReader();
        const contentLength = parseInt(response.headers.get('content-length') || '0');
        
        let receivedLength = 0;
        const chunks: Uint8Array[] = [];
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            chunks.push(value);
            receivedLength += value.length;
            
            if (onProgress && contentLength > 0) {
                const progress = (receivedLength / contentLength) * 100;
                onProgress(progress);
            }
        }
        
        // Reconstruct the response
        const blob = new Blob(chunks);
        return new Response(blob, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    }
    
    /**
     * Store update in local storage
     */
    private async storeUpdate(version: string, blob: Blob): Promise<void> {
        const key = `update_${version}`;
        localStorage.setItem(key, JSON.stringify({
            timestamp: Date.now(),
            size: blob.size
        }));
        
        // Store the actual file in IndexedDB or File System
        // For now, we'll use a simple approach
        const url = URL.createObjectURL(blob);
        localStorage.setItem(`${key}_url`, url);
    }
    
    /**
     * Get stored update
     */
    private async getStoredUpdate(version: string): Promise<Blob | null> {
        const key = `update_${version}`;
        const url = localStorage.getItem(`${key}_url`);
        
        if (!url) return null;
        
        try {
            const response = await fetch(url);
            return await response.blob();
        } catch {
            return null;
        }
    }
    
    /**
     * Extract and install update
     */
    private async extractAndInstall(blob: Blob): Promise<void> {
        // This is where you'd implement the actual installation logic
        // For now, we'll simulate it
        
        // You could:
        // 1. Extract the zip file
        // 2. Replace old files with new ones
        // 3. Update service workers
        // 4. Clear caches
        
        console.log('Installing update...', blob.size, 'bytes');
        
        // Simulate installation time
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    /**
     * Update system version
     */
    private async updateSystemVersion(version: string): Promise<void> {
        // Update the version in settings
        window.novea.settings.set('os-version', version);
        
        // You could also update the actual version object
        // but that would require a restart to take effect
    }
}
