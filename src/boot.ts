import { Novea } from "./Novea";
import { NoveaTransport } from "./core/NoveaTransport";
import { update } from "./core/update";
import { bootSplash } from "./ui/bootSplash";
import { initSw } from "./sw/register-sw";

let DEBUG: boolean = false;

async function parseArgs() {
    const args = new URLSearchParams(window.location.search);

    if (args.get('debug') === 'true') {
        DEBUG = true;
    }

    if (localStorage.getItem('checked') === 'true') {
        return;
    }

    if (args.get('bootstrap-fs') == 'false') {
        const req = indexedDB.open('xen-shared', 1);

        req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
            const db = (e.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains("opts")) {
                db.createObjectStore("opts", { keyPath: "key" });
            }
        };

        req.onsuccess = (e: Event) => {
            const db = (e.target as IDBOpenDBRequest).result;
            const tx = db.transaction("opts", "readwrite");
            const store = tx.objectStore("opts");

            store.put({ key: "bootstrap-fs", value: "false" });
        };

        localStorage.setItem('checked', 'true');
    }
}

async function setupXen() {
    const ComlinkPath = '/libs/comlink/esm/comlink.min.mjs';

    //@ts-ignore
    window.modules = {}
    window.modules.Comlink = await import(ComlinkPath);

    const novea = new Novea();
    window.novea = novea;

    await window.novea.net.init();
    await window.novea.p2p.init();
    await window.novea.vfs.init();
    window.novea.repos.init();
    await window.novea.init();

    window.shared = {};
    window.shared.novea = window.novea;
}

async function isOobe() {
    if (!window.novea.settings.get('oobe')) {
        await update();

        window.novea.settings.set('oobe', true);
        window.novea.settings.set('build-cache', window.novea.version.build);

        location.reload();
    }
}

async function createSw() {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
        await reg.unregister();
    }
    await initSw();
}

function createTransport() {
    const connection = new window.BareMux.BareMuxConnection('/libs/bare-mux/worker.js');
    //@ts-ignore
    connection.setRemoteTransport(new NoveaTransport(), 'NoveaTransport');
}

async function uiInit() {
    window.novea.wallpaper.set();

    window.addEventListener('resize', () => {
        window.novea.wm.handleWindowResize();
    });

    window.novea.taskBar.init();
    window.novea.taskBar.create();
    window.novea.taskBar.appLauncher.init();

    window.novea.wm.onCreated = () => window.novea.taskBar.onWindowCreated();
    window.novea.wm.onClosed = () => window.novea.taskBar.onWindowClosed();

    await window.novea.taskBar.loadPinnedEntries();
    window.novea.taskBar.render();
}

window.addEventListener('load', async () => {
    const splash = bootSplash();
    (window as any).bootSplash = splash;

    parseArgs();
    await setupXen();
    await isOobe();
    await createSw();
    createTransport();
    await window.novea.initSystem();
    await uiInit();

    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    setTimeout(() => {
        splash.element.style.opacity = "0";
        splash.element.addEventListener("transitionend", () => {
            splash.element.remove();
        });
    }, 600);

    if (DEBUG == true) {
        //@ts-ignore
        window.ChiiDevtoolsIframe = window.novea.wm.create({ url: 'https://example.com' }).el.content;

        const pm = window.postMessage;
        window.postMessage = (msg, origin) => {
            pm.call(window, msg, origin);
        };

        const script = document.createElement('script');
        script.src = '/chii/target.js';
        script.setAttribute('embedded', 'true');
        document.body.appendChild(script);
    }
});