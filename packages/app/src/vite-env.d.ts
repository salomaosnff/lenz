/// <reference types="vite/client" />
import type * as allCore from '@editor/core';

declare global {
    // eslint-disable-next-line no-var
    var core: typeof allCore;
}