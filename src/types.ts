import { Novea } from "./Novea";
import { BareMuxConnection } from "@mercuryworkshop/bare-mux";
import * as Comlink from 'comlink';

declare global {
    interface Window {
        novea: Novea;
        modules: {
            Comlink: typeof Comlink;
        }
        BareMux: {
            BareMuxConnection: typeof BareMuxConnection;
        }
        shared: {
            novea?: Novea;
        }
    }
}

export interface Shared {
            novea?: Novea;
}