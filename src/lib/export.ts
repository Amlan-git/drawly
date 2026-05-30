export async function exportCanvas(
  type: 'png' | 'svg',
  elements: readonly any[],
  appState: any,
  files: any,
  filename: string
) {
  if (!elements || elements.length === 0) return;

  const exportAppState = { ...appState, viewBackgroundColor: '#121212' };

  if (type === 'svg') {
    const { exportToSvg } = await import('@excalidraw/excalidraw');
    const svg = await exportToSvg({
      elements,
      appState: exportAppState,
      files,
    });
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    triggerDownload(blob, `${filename}.svg`);
  } else {
    const { exportToBlob } = await import('@excalidraw/excalidraw');
    const blob = await exportToBlob({
      elements,
      appState: exportAppState,
      files,
      mimeType: 'image/png',
    });
    triggerDownload(blob, `${filename}.png`);
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
