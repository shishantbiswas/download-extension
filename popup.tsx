import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import "./style.css"

const storage = new Storage()

type Logs = {
  url: string
  pageUrl: string
  title: string
  favicon: string
  timeStamp: number
}

function Popup() {
  const [logs, setLogs] = useState<Logs[]>([])
  const [copied, setCopied] = useState(null)
  const [currentTabUrl, setCurrentTabUrl] = useState("")

  useEffect(() => {
    // Initial load
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setCurrentTabUrl(tabs[0]?.url || "")
    })

    const fetchLogs = () => {
      storage.get<Logs[]>("request_logs").then((data) => {
        setLogs(data || [])
      })
    }

    fetchLogs()

    const logWatcher = () => {
      fetchLogs()
    }

    // Start watching
    storage.watch({ request_logs: logWatcher })

    // Cleanup
    return () => {
      storage.unwatch({ request_logs: logWatcher })
    }
  }, [currentTabUrl])

  const Clear = () => {
    storage.removeItem("request_logs").then(() => {
      setLogs([])
    })
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCopied(null)
    }, 1000)

    return () => {
      clearTimeout(timeout)
    }
  }, [copied])

  return (
    <div className="p-2 text-sm overflow-hidden min-h-80 max-h-80 min-w-96 max-w-96 rounded-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Captured Requests</h2>
        <button className="px-3 py-1 rounded-full bg-black/10" onClick={Clear}>
          Clear
        </button>
      </div>
      <ul className="mt-2 space-y-4 max-h-64 overflow-auto text-xs">
        {logs.
          sort((a, b) => a.timeStamp > b.timeStamp ? -1 : 1)
          .map((log, i) => {
            const isCurrent = log.pageUrl === currentTabUrl

            return (
              <div
                key={i}
                onClick={async () => {
                  await navigator.clipboard.writeText(log.url)
                  setCopied(log.url)
                }}
                className="flex gap-4 justify-between hover:bg-black/20 rounded-md p-2">
                <div className="flex gap-3">
                  <img
                    src={log.favicon}
                    alt="favicon"
                    className="size-[50px] rounded-md"
                  />
                  <div className="space-y-1">
                    <h3 className="line-clamp-1 text-xs text-wrap w-[70%]">{log.title}</h3>
                    <p>{new Date(log.timeStamp).toLocaleString(undefined, {
                      hour: 'numeric',
                      minute: 'numeric',
                      second: 'numeric',
                      hour12: true,
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
                {<button
                  disabled={copied === log.url}
                  onClick={async () => {
                    await navigator.clipboard.writeText(log.url)
                    setCopied(log.url)
                  }}
                  className="disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1 rounded-full disabled:bg-green-800 disabled:text-green-300 text-nowrap bg-black/20 h-fit"
                >{copied === log.url ? "Copied" : isCurrent ? "Current" : "Copy URL"}</button>}
              </div>
            )
          })}
      </ul>
    </div>
  )
}

export default Popup
