export async function init() {
    let scripts: any;
    let doScripts: boolean;

    try {
        scripts = await window.novea.fs.list('/usr/init');
        doScripts = true;
    } catch {
        doScripts = false;
    }

    if (doScripts == true) {
        scripts.forEach(async (el) => {
            if (el.isFile == true) {
                const script = (await window.novea.fs.read(`/init/${el.name}`, 'text') as string);

                window.novea.process.spawn({
                    async: true,
                    type: 'direct',
                    content: script
                });
            }
        });
    }

    const startUp = (window.novea.settings.get('startup')) as string[] | undefined;

    if (startUp) {
        for (const id of startUp) {
            await window.novea.packages.open(id);
        }
    }
}