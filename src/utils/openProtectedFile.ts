export type OpenProtectedFileResult = 'opened' | 'popup-blocked';

export async function openProtectedFile(
  loadUrl: () => Promise<string>
): Promise<OpenProtectedFileResult> {
  const tab = window.open('about:blank', '_blank');
  if (!tab) return 'popup-blocked';

  tab.opener = null;

  try {
    const url = await loadUrl();
    tab.location.replace(url);
    return 'opened';
  } catch (error) {
    tab.close();
    throw error;
  }
}
