export class Wallpaper {
    public async upload(type?: 'url' | 'prompt' | 'fs', url?: string) {
        let finalUrl: string | undefined;

        if (type === 'url' && url) {
                    const u = window.novea.net.encodeUrl(url);
        await window.novea.fs.fetch(u, `/usr/wallpapers/${u.split('.')[0]}.${u.split('.').at(-1)}`);
            finalUrl = `/fs/usr/wallpapers/${u.split('.')[0]}.${u.split('.').at(-1)}`;
        } else if (type === 'prompt') {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{ accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] } }],
            });

            const file = await fileHandle.getFile();
            const path = `/usr/wallpapers/${file.name}`;

            await window.novea.fs.write(path, file);
            finalUrl = `/fs${path}`;
        } else if (type === 'fs') {
            const h = await window.novea.FilePicker.pick({});

            await window.novea.fs.copy(h.path as string, `/usr/wallpapers/${h.stat.name}`);
            finalUrl = `/usr/wallpapers/${h.stat.name}`;
        } else {
            const h = await fetch('/assets/wallpaper.webp');
            const aB = await h.arrayBuffer();
            await window.novea.fs.write('/usr/wallpapers/wallpaper.webp', aB);
            finalUrl = '/fs/usr/wallpapers/wallpaper.webp';
        }

        if (finalUrl) {
            window.novea.settings.set('wallpaper', finalUrl);
            this.update();
        }
    }

    public async set(filename?: string) {
        let final: string | null = null;

        if (filename) {
            final = `/fs/usr/wallpapers/${filename}`;
        }

        if (!final) {
            final = await this.get();

            if (!final) {
                const h = await fetch('/assets/wallpaper.webp');
                const aB = await h.arrayBuffer();
                await window.novea.fs.write('/usr/wallpapers/wallpaper.webp', aB);
                final = '/fs/usr/wallpapers/wallpaper.webp';
                window.novea.settings.set('wallpaper', final);
            }

        } else {
            window.novea.settings.set('wallpaper', final);
        }

        this.update();
    }

    public async get(): Promise<string | null> {
        return window.novea.settings.get('wallpaper');
    }

    public async remove(file?: string) {
        if (file) {
            await window.novea.fs.rm(`/usr/wallpapers/${file}`);
        }

        window.novea.settings.remove('wallpaper');
        this.set();
    }

    public async default() {
        const defualtWP = '/assets/wallpaper.webp';
        const target = '/usr/wallpapers/default.webp';

        try {
            await window.novea.fs.read(target);
        } catch {
            const response = await fetch(defualtWP);
            const blob = await response.blob();

            await window.novea.fs.write(target, blob);
        }

        window.novea.settings.set('wallpaper', `/fs${target}`);
        this.update();
    }

    public async list() {
        return await window.novea.fs.list('/usr/wallpapers');
    }

    private async update() {
        const url = await this.get();

        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundImage = url ? `url("${url}")` : '';
    }
}