document.getElementById('btn-reinject').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.scripting ? chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const existing = document.getElementById('vtop-timetable-container');
        if (existing) existing.remove();
        window.location.reload();
      }
    }) : chrome.tabs.reload(tab.id);
  }
});
