import '@src/Popup.css';
import { useEffect, useState } from 'react';

const Popup = () => {
  const [msg, setMsg] = useState<{
    type: 'success' | 'error';
    content: string;
  } | null>(null);
  const [content, setContent] = useState<string[]>([]);
  const [openKey, setOpenKey] = useState<{ url: string; key: string } | null>(null);
  const [current, setCurrent] = useState<number>(0);
  const [newRote, setNewRote] = useState<Rote>({
    title: '',
    content: '',
    type: 'rote',
    tags: [],
    state: 'private',
    pin: false,
  });
  const [msgTimer, setMsgTimer] = useState<number | null>(null);

  useEffect(() => {
    if (msg) {
      if (msgTimer) {
        clearTimeout(msgTimer);
      }
      const timer = setTimeout(() => {
        setMsg(null);
      }, 2000);
      setMsgTimer(timer);
    }
  }, [msg]);

  type Rote = {
    title: string;
    content: string;
    type: string;
    tags: string[];
    state: string;
    pin: boolean;
  };
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    chrome.storage.local.get('content', res => {
      if (!res.content) {
        return;
      }
      setContent(res.content);
      setNewRote({ ...newRote, content: res.content[0] });
    });
    chrome.storage.local.get('openKey', res => {
      setOpenKey(res.openKey || null);
    });
  }, []);

  useEffect(() => {
    setNewRote(prevState => ({
      ...prevState,
      content: content[current] || '',
    }));
  }, [current, content]);

  function cleanAllContet() {
    setCurrent(0);
    setContent([]);
    chrome.storage.local.set({ content: [] });
  }

  function handleContentCurrentChange(e: React.MouseEvent<HTMLButtonElement>) {
    const buttonName = e.currentTarget.name;
    const contentLength = content.length;
    const currentIndex = current;

    if (content.length === 1) {
      setNewRote(prevState => ({
        ...prevState,
        content: content[0] || '',
      }));
      return;
    }
    if (buttonName === 'last') {
      const index = currentIndex - 1 < 0 ? contentLength - 1 : currentIndex - 1;
      setCurrent(index);
    } else if (buttonName === 'next') {
      const index = currentIndex + 1 >= contentLength ? 0 : currentIndex + 1;
      setCurrent(index);
    }
  }
  function submit() {
    setSubmitting(true);
    if (!openKey) {
      setSubmitting(false);
      setMsg({
        type: 'error',
        content: '请先配置OpenKey',
      });
      return;
    }
    if (newRote.content.length === 0) {
      setMsg({
        type: 'error',
        content: '内容不能为空',
      });
      setSubmitting(false);
      return;
    }
    fetch(openKey.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...newRote, openkey: openKey.key }),
    })
      .then(async response => {
        const data = await response.json();
        if (data.code === 0) {
          setSubmitting(false);
          const ctx = content;
          ctx.splice(current, 1);
          setMsg({
            type: 'success',
            content: '发送成功',
          });
          setTimeout(() => {
            setMsg(null);
          }, 2000);
          setContent(ctx);
          setNewRote({ ...newRote, content: '' });
          chrome.storage.local.set({ content: ctx });
        } else {
          setSubmitting(false);
          setMsg({
            type: 'error',
            content: '发送失败:' + data.message,
          });
        }
      })
      .catch(error => {
        setSubmitting(false);
        setMsg({
          type: 'error',
          content:
            '发送失败:' +
            error.message +
            `（如果后端配置了CORS环境变量，请添加 chrome-extension://cahpbdbfdfnmoachkjmcfgbbnmjcbpej 允许插件的跨域请求！）`,
        });
      });
  }

  function reSetOpenkey() {
    chrome.storage.local.set({ openKey: null });
    setOpenKey(null);
  }

  function Config() {
    const [openKeyStr, setOpenKeyStr] = useState('');
    function parseUrlAndKey(urlString) {
      try {
        const url = new URL(urlString);
        const openkey = url.searchParams.get('openkey');
        return {
          url: url.origin + url.pathname,
          key: openkey,
        };
      } catch (error) {
        return {
          url: '',
          key: '',
        };
      }
    }

    function config() {
      const { url, key } = parseUrlAndKey(openKeyStr);
      if (url && key) {
        console.log(url, key);
        setMsg(null);
        setOpenKey({ url, key });
        chrome.storage.local.set({ openKey: { url, key } });
      } else {
        setMsg({
          type: 'error',
          content: 'OpenKey解析失败',
        });
      }
    }

    return (
      <div className=" flex flex-col gap-2">
        <p className=" text-base font-mono text-gray-500">需要配置OpenKey</p>
        <p className=" text-sm font-mono text-gray-300">
          例如在 <a href="https://rote.ink">https://rote.ink</a> 中注册并在 我的 页面中复制 openkeyUrl{' '}
        </p>
        <textarea
          className="p-3 w-full bg-slate-50 border rounded-md"
          placeholder="https://api.rote.ink/v1/api/openkey/onerote?openkey=661fxxxxxx195fb25&content=这是一条使用OpenKey发送的笔记。&tag=FromOpenKey&tag=标签二&state=private"
          rows={5}
          onChange={e => setOpenKeyStr(e.target.value)}
        />
        <button className=" bg-slate-800 text-white px-2 py-1 rounded-md" onClick={config}>
          解析并配置
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 text-base flex flex-col gap-2">
      <div className=" flex items-center gap-2">
        <h1 className="text-2xl font-semibold font-mono">Rote</h1>
        {openKey && (
          <>
            <button
              className=" ml-auto bg-yellow-50 text-yellow-500 border border-yellow-500 text-xs px-1 rounded-md"
              onClick={reSetOpenkey}>
              重新绑定
            </button>
            <p className=" text-xs text-gray-500">{openKey?.key.slice(0, 4)}</p>
          </>
        )}
      </div>

      {openKey ? (
        <>
          <textarea
            value={newRote.content}
            className="p-3 w-full bg-slate-50 border rounded-md"
            placeholder="采菊东篱下，悠然见南山"
            rows={5}
            onChange={e =>
              setNewRote(prevState => ({
                ...prevState,
                content: e.target.value,
              }))
            }
          />
          {content.length > 0 && (
            <>
              <div className=" text-gray-500 flex gap-2">
                暂存笔记：{`${content.length}条，当前是第${current + 1}条`}
              </div>
              <div className=" text-lime-500 flex gap-2">
                <button
                  name="last"
                  className=" cursor-pointer border border-lime-500 rounded-md bg-lime-50 px-2 py-1 text-sm"
                  onClick={handleContentCurrentChange}>
                  上一条
                </button>
                <button
                  name="next"
                  className=" cursor-pointer border border-lime-500 rounded-md bg-lime-50 px-2 py-1 text-sm"
                  onClick={handleContentCurrentChange}>
                  下一条
                </button>
                <button
                  className=" cursor-pointer text-red-500 border border-red-500 rounded-md bg-red-50 px-2 py-1 text-sm"
                  onClick={cleanAllContet}>
                  全部清除
                </button>
              </div>
            </>
          )}
          <div className=" flex items-center gap-2">
            标签:
            <input
              type="text"
              value={newRote.tags.join(' ')}
              placeholder="多标签使用空格分割"
              onInput={e =>
                setNewRote(prevState => ({
                  ...prevState,
                  tags: (e.target as HTMLInputElement).value.split(' '),
                }))
              }
              className=" flex-grow px-2 py-1 text-base bg-slate-50 border rounded-md"
            />
          </div>
          <div className=" flex items-center gap-2">
            <div className=" flex items-center border gap-2 bg-slate-50 px-2 py-1 rounded-md">
              <input
                type="checkbox"
                defaultChecked={newRote.state == 'public'}
                onChange={e =>
                  setNewRote(prevState => ({
                    ...prevState,
                    state: e.target.checked ? 'public' : 'private',
                  }))
                }
              />
              <button>公开</button>
            </div>
            <div className=" flex items-center border gap-2 bg-slate-50 px-2 py-1 rounded-md">
              <input
                type="checkbox"
                defaultChecked={newRote.pin}
                onChange={e =>
                  setNewRote(prevState => ({
                    ...prevState,
                    pin: e.target.checked,
                  }))
                }
              />
              <button>置顶</button>
            </div>
          </div>
          <button className=" bg-slate-800 text-white px-2 py-1 rounded-md" onClick={submit} disabled={submitting}>
            发布
          </button>
        </>
      ) : (
        <Config />
      )}
      {msg && (
        <div
          className={` text-sm px-2 py-1 rounded-md ${msg.type === 'success' ? 'text-lime-500 bg-lime-50' : 'text-red-500 bg-red-50'} `}>
          {msg.content}
        </div>
      )}
    </div>
  );
};

export default Popup;
