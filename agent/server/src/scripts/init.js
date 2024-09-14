
;(() => {
    const importmap = document.createElement('script');

    importmap.type = 'importmap';
    
    importmap.textContent = JSON.stringify({
        imports: $IMPORTS$
    }, null, 2);

    document.currentScript.after(importmap);

    window.__LENZ_EXTENSIONS__ = $EXTENSIONS$;
})()