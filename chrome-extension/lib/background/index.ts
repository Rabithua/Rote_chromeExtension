chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    type: 'normal',
    title: '缓存选中文本',
    id: 'Rote-record-text',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(info => {
  chrome.storage.local.get('content', res => {
    chrome.storage.local.set({ content: [...res.content, info.selectionText + '\n'] });
  });
});

chrome.runtime.onMessage.addListener(function (request) {
  if (request.action == 'open_popup') {
    // 打开插件
    window.open(chrome.runtime.getURL('popup/index.html'));
  }
});
