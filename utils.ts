
export const downloadFile = (filename: string, content: string, mimeType: string = 'text/markdown') => {
    if (!content) return;

    // Using a data URI is reliable in sandboxed environments where creating blob URLs
    // or programmatically clicking links can be restricted.
    const dataUri = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);

    const link = document.createElement('a');
    link.href = dataUri;
    link.download = filename;
    
    // The link needs to be in the DOM for the click to work in some browsers.
    document.body.appendChild(link);
    link.click();
    
    // Clean up the DOM and the created link.
    document.body.removeChild(link);
};
